
import { Injectable } from '@nestjs/common';
import { NvidiaAiService } from '../ai/nvidia-ai.service';
import { RESUME_ANALYSIS_SYSTEM_PROMPT } from '../ai/prompts/resume-analysis.prompt';
import { ResumeAnalysisResult } from '../ai/interfaces/resume-analysis-result.interface';

@Injectable()
export class ResumeAiHelper {
  constructor(private readonly nvidiaAi: NvidiaAiService) {}

  async analyze(
    resumeText: string,
    jobDescription: string,
  ): Promise<ResumeAnalysisResult> {
    if (!resumeText.trim()) {
      throw new Error('No readable text was extracted from the PDF.');
    }

    const result = await this.nvidiaAi.generateJson<ResumeAnalysisResult>([
      {
        role: 'system',
        content: RESUME_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `
Analyze this resume against the job description.

<resume>
${resumeText}
</resume>

<job_description>
${jobDescription}
</job_description>
`,
      },
    ]);

    this.validateResult(result);
    return result;
  }

  private validateResult(result: ResumeAnalysisResult): void {
    if (
      !Number.isFinite(result.matchScore) ||
      result.matchScore < 0 ||
      result.matchScore > 100
    ) {
      throw new Error('Invalid AI match score.');
    }

    const listFields = [
      'matchingSkills',
      'missingSkills',
      'strengths',
      'improvements',
      'recommendations',
    ] as const;

    for (const field of listFields) {
      if (
        !Array.isArray(result[field]) ||
        !result[field].every((item) => typeof item === 'string')
      ) {
        throw new Error(`Invalid AI response field: ${field}`);
      }
    }

    if (typeof result.summary !== 'string') {
      throw new Error('Invalid AI summary.');
    }
  }
}
