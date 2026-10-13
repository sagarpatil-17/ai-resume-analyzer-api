
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import pdf from 'pdf-parse';

export interface ResumeAnalysis {
    matchScore: number;
    summary: string;
    matchingSkills: string[];
    missingSkills: string[];
    strengths: string[];
    improvements: string[];
}

@Injectable()
export class ResumeService {
    private readonly logger = new Logger(ResumeService.name);
    private readonly genAI: GoogleGenAI;

    constructor(configService: ConfigService) {
        const apiKey = configService.get<string>('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is missing from the backend .env file.');
        }

        this.genAI = new GoogleGenAI({ apiKey });
    }

    async analyzeResume(
        resumeBuffer: Buffer,
        jobDescription: string,
    ): Promise<ResumeAnalysis> {
        let resumeText: string;

        try {
            const parsedPdf = await pdf(resumeBuffer);
            resumeText = parsedPdf.text.trim();
        } catch {
            throw new BadRequestException(
                'Unable to read this PDF. Please upload a valid, text-based PDF.',
            );
        }

        if (resumeText.length < 30) {
            throw new BadRequestException(
                'Not enough readable text found. Scanned PDFs may require OCR.',
            );
        }

        // Prevent excessively large inputs from being sent to the AI.
        resumeText = resumeText.slice(0, 30000);
        jobDescription = jobDescription.slice(0, 12000);

        const prompt = `
You are an expert resume reviewer and recruitment assistant.

Analyze the candidate's resume against the job description.

Rules:
- Base your analysis only on the supplied resume and job description.
- Do not invent skills, experience, qualifications, or achievements.
- matchingSkills: skills explicitly supported by the resume and relevant to the job.
- missingSkills: relevant job requirements not clearly demonstrated in the resume.
- strengths: specific strengths supported by the resume.
- improvements: actionable suggestions tailored to this role.
- matchScore: integer from 0 to 100 representing estimated alignment.
- summary: concise explanation of the candidate's overall fit.
- Do not treat the score as a hiring decision or guarantee.

Return ONLY valid JSON with exactly these fields:
{
  "matchScore": 0,
  "summary": "string",
  "matchingSkills": ["string"],
  "missingSkills": ["string"],
  "strengths": ["string"],
  "improvements": ["string"]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

        try {

            const response = await this.generateWithRetry(prompt);

            const responseText = response.text;

            if (!responseText) {
                throw new Error('Gemini returned an empty response.');
            }

            const parsed: unknown = JSON.parse(responseText);

            return this.validateAnalysis(parsed);

        } catch (error: unknown) {
            if (
                error instanceof BadRequestException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(`Gemini analysis failed: ${errorMessage}`);

            if (/429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(errorMessage)) {
                throw new ServiceUnavailableException(
                    'AI usage limit reached. Please try again later.',
                );
            }

            throw new InternalServerErrorException(
                'Unable to analyze the resume right now. Please try again.',
            );
        }
    }

    private validateAnalysis(data: unknown): ResumeAnalysis {
        if (!data || typeof data !== 'object') {
            throw new InternalServerErrorException(
                'AI returned an invalid analysis.',
            );
        }

        const result = data as Record<string, unknown>;

        const isStringArray = (value: unknown): value is string[] =>
            Array.isArray(value) &&
            value.every((item) => typeof item === 'string');

        if (
            typeof result.matchScore !== 'number' ||
            !Number.isFinite(result.matchScore) ||
            result.matchScore < 0 ||
            result.matchScore > 100 ||
            typeof result.summary !== 'string' ||
            !isStringArray(result.matchingSkills) ||
            !isStringArray(result.missingSkills) ||
            !isStringArray(result.strengths) ||
            !isStringArray(result.improvements)
        ) {
            throw new InternalServerErrorException(
                'AI returned an unexpected analysis format.',
            );
        }

        return {
            matchScore: Math.round(result.matchScore),
            summary: result.summary,
            matchingSkills: result.matchingSkills,
            missingSkills: result.missingSkills,
            strengths: result.strengths,
            improvements: result.improvements,
        };
    }


    private async generateWithRetry(prompt: string) {
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this.genAI.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        temperature: 0.2,
                    },
                });
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : String(error);

                const retryable =
                    /503|UNAVAILABLE|high demand|429|RESOURCE_EXHAUSTED|rate.?limit/i.test(
                        message,
                    );

                if (!retryable || attempt === maxAttempts) {
                    throw error;
                }

                const delayMs = attempt * 2000;

                this.logger.warn(
                    `Gemini temporarily unavailable. Retry ${attempt}/${maxAttempts} in ${delayMs}ms.`,
                );

                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        throw new Error('Gemini request failed after retries.');
    }

}
