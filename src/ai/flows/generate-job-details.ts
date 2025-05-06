'use server';

/**
 * @fileOverview Generates a job description and relevant keywords based on a job role.
 *
 * - generateJobDetails - Generates job details for a given role.
 * - GenerateJobDetailsInput - The input type for the generateJobDetails function.
 * - GenerateJobDetailsOutput - The return type for the generateJobDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateJobDetailsInputSchema = z.object({
  jobRole: z.string().describe('The job role for which to generate details (e.g., Software Engineer, Product Manager).'),
});
export type GenerateJobDetailsInput = z.infer<typeof GenerateJobDetailsInputSchema>;

const GenerateJobDetailsOutputSchema = z.object({
  jobDescription: z.string().describe('A concise and relevant job description for the specified role (around 100-150 words).'),
  keywords: z.string().describe('A comma-separated list of 5-10 relevant keywords for the job role.'),
});
export type GenerateJobDetailsOutput = z.infer<typeof GenerateJobDetailsOutputSchema>;

export async function generateJobDetails(
  input: GenerateJobDetailsInput
): Promise<GenerateJobDetailsOutput> {
  return generateJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDetailsPrompt',
  input: { schema: GenerateJobDetailsInputSchema },
  output: { schema: GenerateJobDetailsOutputSchema },
  prompt: `You are an expert hiring manager AI. Given a job role, generate a concise job description (around 100-150 words) and a list of 5-10 relevant comma-separated keywords.

Job Role: {{{jobRole}}}

Generate the job description and keywords according to the output schema.
Keywords should be comma-separated.
The job description should be realistic and suitable for attracting candidates.`,
});

const generateJobDetailsFlow = ai.defineFlow(
  {
    name: 'generateJobDetailsFlow',
    inputSchema: GenerateJobDetailsInputSchema,
    outputSchema: GenerateJobDetailsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
