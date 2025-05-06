'use server';

/**
 * @fileOverview Analyzes candidate responses during interviews for sentiment, clarity, and keyword relevance.
 *
 * - analyzeCandidateResponse - Analyzes the candidate's response.
 * - AnalyzeCandidateResponseInput - The input type for the analyzeCandidateResponse function.
 * - AnalyzeCandidateResponseOutput - The return type for the analyzeCandidateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCandidateResponseInputSchema = z.object({
  candidateResponse: z
    .string()
    .describe('The candidate response to be analyzed.'),
  jobDescription: z
    .string()
    .describe('The job description for the role.'),
  keywords: z
    .string()
    .describe('Keywords relevant to the role.'),
});
export type AnalyzeCandidateResponseInput = z.infer<typeof AnalyzeCandidateResponseInputSchema>;

const AnalyzeCandidateResponseOutputSchema = z.object({
  sentiment: z.string().describe('The sentiment of the response (e.g., positive, negative, neutral).'),
  clarity: z.string().describe('An assessment of the clarity and coherence of the response.'),
  keywordRelevance: z.string().describe('An analysis of the relevance of the response to the provided keywords.'),
  overallAssessment: z.string().describe('An overall assessment of the candidate based on the analysis.'),
});
export type AnalyzeCandidateResponseOutput = z.infer<typeof AnalyzeCandidateResponseOutputSchema>;

export async function analyzeCandidateResponse(
  input: AnalyzeCandidateResponseInput
): Promise<AnalyzeCandidateResponseOutput> {
  return analyzeCandidateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCandidateResponsePrompt',
  input: {schema: AnalyzeCandidateResponseInputSchema},
  output: {schema: AnalyzeCandidateResponseOutputSchema},
  prompt: `You are an AI expert in analyzing candidate responses during interviews.

  Analyze the candidate's response based on the following job description and keywords.

  Job Description: {{{jobDescription}}}
  Keywords: {{{keywords}}}

  Candidate Response: {{{candidateResponse}}}

  Provide an analysis of the sentiment, clarity, and keyword relevance of the response.
  Also provide an overall assessment of the candidate based on your analysis.
  Make sure to populate all the fields defined in the output schema.`,
});

const analyzeCandidateResponseFlow = ai.defineFlow(
  {
    name: 'analyzeCandidateResponseFlow',
    inputSchema: AnalyzeCandidateResponseInputSchema,
    outputSchema: AnalyzeCandidateResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
