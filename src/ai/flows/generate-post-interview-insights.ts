// 'use server'
'use server';

/**
 * @fileOverview Generates post-interview insights and comparison metrics for candidates.
 *
 * - generatePostInterviewInsights - A function that generates insights and comparison metrics.
 * - PostInterviewInsightsInput - The input type for the generatePostInterviewInsights function.
 * - PostInterviewInsightsOutput - The return type for the generatePostInterviewInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PostInterviewInsightsInputSchema = z.object({
  candidateResponses: z
    .array(z.string())
    .describe('An array of candidate responses during the interview.'),
  jobDescription: z.string().describe('The job description for the role.'),
});
export type PostInterviewInsightsInput = z.infer<
  typeof PostInterviewInsightsInputSchema
>;

const PostInterviewInsightsOutputSchema = z.object({
  insights: z.string().describe('Insights about the candidate.'),
  comparisonMetrics: z.string().describe('Comparison metrics for the candidate.'),
});
export type PostInterviewInsightsOutput = z.infer<
  typeof PostInterviewInsightsOutputSchema
>;

export async function generatePostInterviewInsights(
  input: PostInterviewInsightsInput
): Promise<PostInterviewInsightsOutput> {
  return generatePostInterviewInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'postInterviewInsightsPrompt',
  input: {schema: PostInterviewInsightsInputSchema},
  output: {schema: PostInterviewInsightsOutputSchema},
  prompt: `You are an expert in talent acquisition, and your goal is to provide a hiring manager with key insights about a candidate after an interview, and comparison metrics to help make a decision.

  Job Description: {{{jobDescription}}}

  Candidate Responses:
  {{#each candidateResponses}}
  - {{{this}}}
  {{/each}}

  Provide insights about the candidate, highlighting their strengths and weaknesses based on their responses and the job description.
  Also provide comparison metrics so that the hiring manager can compare candidates, but intelligently decide what is important to include in this comparison. Focus on objective, measurable criteria where possible, but don't hesitate to include subjective observations.
  `,
});

const generatePostInterviewInsightsFlow = ai.defineFlow(
  {
    name: 'generatePostInterviewInsightsFlow',
    inputSchema: PostInterviewInsightsInputSchema,
    outputSchema: PostInterviewInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
