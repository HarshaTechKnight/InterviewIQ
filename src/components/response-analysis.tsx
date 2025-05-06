"use client";

import type React from 'react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { analyzeCandidateResponse, AnalyzeCandidateResponseOutput } from '@/ai/flows/analyze-candidate-response';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AnalysisCard } from '@/components/analysis-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart, CheckCircle, Info, Smile, Speech, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  candidateResponse: z.string().min(10, { message: 'Response must be at least 10 characters.' }),
  jobDescription: z.string().min(20, { message: 'Job description must be at least 20 characters.' }),
  keywords: z.string().min(3, { message: 'Please provide relevant keywords.' }),
});

type FormData = z.infer<typeof formSchema>;

export function ResponseAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCandidateResponseOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateResponse: '',
      jobDescription: '',
      keywords: '',
    },
  });

  const onSubmit = (data: FormData) => {
    setAnalysisResult(null); // Clear previous results
    startTransition(async () => {
      try {
        const result = await analyzeCandidateResponse(data);
        setAnalysisResult(result);
        toast({
          title: "Analysis Complete",
          description: "Candidate response analyzed successfully.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error analyzing response:", error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the candidate response. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const renderSentimentIcon = (sentiment: string) => {
    if (sentiment.toLowerCase().includes('positive')) return <Smile className="h-4 w-4 text-green-500" />;
    if (sentiment.toLowerCase().includes('negative')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Info className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Response Analysis</CardTitle>
        <CardDescription>Enter candidate's response, job description, and relevant keywords to get AI-powered analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste the job description here..." {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., communication, leadership, javascript" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="candidateResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Response</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the candidate's response here..." {...field} disabled={isPending} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Analyzing...' : 'Analyze Response'}
            </Button>
          </form>
        </Form>

        {(isPending || analysisResult) && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isPending ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : analysisResult ? (
                <>
                  <AnalysisCard
                    title="Sentiment"
                    value={analysisResult.sentiment}
                    icon={renderSentimentIcon(analysisResult.sentiment)}
                    valueClassName={analysisResult.sentiment.toLowerCase().includes('positive') ? 'text-green-600' : analysisResult.sentiment.toLowerCase().includes('negative') ? 'text-red-600' : ''}
                   />
                  <AnalysisCard
                    title="Clarity"
                    value={analysisResult.clarity}
                    icon={Speech}
                  />
                  <AnalysisCard
                    title="Keyword Relevance"
                    value={analysisResult.keywordRelevance}
                    icon={CheckCircle}
                  />
                </>
              ) : null}
            </div>
             {isPending ? (
                <Skeleton className="h-32 w-full mt-4" />
              ) : analysisResult ? (
                <Card className="mt-4 animate-fadeIn">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-primary"/>
                      Overall Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground">{analysisResult.overallAssessment}</p>
                  </CardContent>
                </Card>
              ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
