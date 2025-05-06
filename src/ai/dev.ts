import { config } from 'dotenv';
config();

import '@/ai/flows/generate-post-interview-insights.ts';
import '@/ai/flows/analyze-candidate-response.ts';
import '@/ai/flows/generate-job-details.ts'; // Add this line
