
export interface ResumeAnalysisResult {
  matchScore: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}
