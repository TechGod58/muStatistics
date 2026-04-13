export type EvidenceSummaryInput = {
  projectName: string;
  retrievalCount: number;
  codes: string[];
  analyticQuestion: string;
};

export function buildEvidenceSummaryPrompt(input: EvidenceSummaryInput): string {
  return [
    `Project: ${input.projectName}`,
    `Analytic question: ${input.analyticQuestion}`,
    `Evidence excerpts available: ${input.retrievalCount}`,
    `Codes in scope: ${input.codes.join(', ') || 'none specified'}`,
    'Summarize the strongest themes, disagreements, and traceable evidence patterns.',
    'Flag where evidence is thin or where more coding review is needed.'
  ].join('\n');
}

export function scoreEvidenceCoverage(retrievalCount: number): 'low' | 'medium' | 'high' {
  if (retrievalCount >= 25) return 'high';
  if (retrievalCount >= 8) return 'medium';
  return 'low';
}
