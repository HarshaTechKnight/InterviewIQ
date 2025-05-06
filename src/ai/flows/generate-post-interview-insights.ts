'use server';

/**
 * @fileOverview Generates structured post-interview insights and comparison metrics for candidates.
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
  overallSummary: z.string().describe('A brief overall summary of the candidate based on the interview responses and job description (2-3 sentences).'),
  strengths: z.array(z.string()).describe('A list of 3-5 key strengths identified for the candidate, presented as bullet points.'),
  weaknesses: z.array(z.string()).describe('A list of 2-3 potential weaknesses or areas for development, presented as bullet points.'),
  skillAssessment: z.array(
      z.object({
          skill: z.string().describe("A relevant skill mentioned or implied in the responses or job description."),
          assessment: z.string().describe("A brief assessment of the candidate's proficiency or experience in this skill based on their responses (e.g., 'Demonstrated strong understanding', 'Mentioned briefly', 'Lacked specific examples').")
      })
  ).describe("Assessment of 3-5 key skills relevant to the job description."),
  comparisonPoints: z.array(
    z.object({
      metric: z.string().describe("A specific point or metric for comparison against other candidates (e.g., 'Technical Depth', 'Communication Clarity', 'Years of Experience mentioned', 'Problem-Solving Approach')."),
      value: z.string().describe("The candidate's standing or value for this metric based on the interview (e.g., 'Strong', 'Average', 'Needs Improvement', '5 years', 'Logical and structured').")
    })
  ).describe("3-5 objective or subjective points useful for comparing this candidate against others.")
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
  prompt: `You are an expert Talent Acquisition Analyst AI. Your goal is to provide a hiring manager with structured, actionable insights about a candidate after an interview, based on their responses and the job description.

  Job Description:
  {{{jobDescription}}}

  Candidate Responses:
  {{#each candidateResponses}}
  - {{{this}}}
  {{/each}}

  Please analyze the provided information and generate the following structured output:

  1.  **Overall Summary:** A concise (2-3 sentences) summary of the candidate's suitability based on the interview.
  2.  **Strengths:** List 3-5 key strengths observed.
  3.  **Weaknesses:** List 2-3 potential weaknesses or areas needing further exploration.
  4.  **Skill Assessment:** Identify 3-5 key skills (from the job description or responses) and provide a brief assessment for each based *only* on the candidate's responses.
  5.  **Comparison Points:** Provide 3-5 specific, comparable metrics or points (objective or subjective) that would be useful for comparing this candidate against others for this role.

  Ensure your output strictly adheres to the defined output schema. Be concise and focus on information derived directly from the provided context.
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
    // Ensure arrays are initialized even if empty, to match schema
     const validatedOutput: PostInterviewInsightsOutput = {
       overallSummary: output?.overallSummary ?? "No summary generated.",
       strengths: output?.strengths ?? [],
       weaknesses: output?.weaknesses ?? [],
       skillAssessment: output?.skillAssessment ?? [],
       comparisonPoints: output?.comparisonPoints ?? [],
     };
     return validatedOutput;
  }
);
