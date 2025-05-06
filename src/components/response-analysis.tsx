"use client";

import type React from 'react';
import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { analyzeCandidateResponse, AnalyzeCandidateResponseOutput } from '@/ai/flows/analyze-candidate-response';
import { generateJobDetails, GenerateJobDetailsOutput } from '@/ai/flows/generate-job-details'; // Import new flow
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'; // Added FormDescription
import { Input } from '@/components/ui/input';
import { AnalysisCard } from '@/components/analysis-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { AlertCircle, BarChart, CheckCircle, Info, Smile, Speech, ThumbsUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  jobRole: z.string().optional(), // Add jobRole
  candidateResponse: z.string().min(10, { message: 'Response must be at least 10 characters.' }),
  jobDescription: z.string().min(20, { message: 'Job description must be at least 20 characters.' }),
  keywords: z.string().min(3, { message: 'Please provide relevant keywords.' }),
});

type FormData = z.infer<typeof formSchema>;

const jobRoles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Specialist",
  "Sales Representative",
  "Human Resources Manager",
];

export function ResponseAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCandidateResponseOutput | null>(null);
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const [isGeneratingDetails, startDetailsTransition] = useTransition();
  const [selectedJobRole, setSelectedJobRole] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobRole: '',
      candidateResponse: '',
      jobDescription: '',
      keywords: '',
    },
  });

  // Effect to generate job details when a role is selected
  useEffect(() => {
    if (selectedJobRole) {
      form.setValue('jobDescription', ''); // Clear previous values
      form.setValue('keywords', '');
      setAnalysisResult(null); // Clear analysis results

      startDetailsTransition(async () => {
        try {
          const result = await generateJobDetails({ jobRole: selectedJobRole });
          form.setValue('jobDescription', result.jobDescription);
          form.setValue('keywords', result.keywords);
          toast({
            title: "Job Details Generated",
            description: `Details for ${selectedJobRole} generated successfully.`,
            variant: "default",
          });
        } catch (error) {
          console.error("Error generating job details:", error);
          toast({
            title: "Generation Failed",
            description: "Could not generate job description and keywords. Please try again or enter manually.",
            variant: "destructive",
          });
        }
      });
    }
  }, [selectedJobRole, form, toast]);

  const handleJobRoleChange = (value: string) => {
    setSelectedJobRole(value);
    form.setValue('jobRole', value);
  };

  const onSubmit = (data: FormData) => {
    // Exclude jobRole from the data sent to analysis flow if needed, or keep it if the flow expects it
    const { jobRole, ...analysisData } = data;
    setAnalysisResult(null); // Clear previous results
    startAnalysisTransition(async () => {
      try {
        const result = await analyzeCandidateResponse(analysisData); // Send data without jobRole
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
    const lowerSentiment = sentiment?.toLowerCase() || '';
    if (lowerSentiment.includes('positive')) return <Smile className="h-4 w-4 text-green-500" />;
    if (lowerSentiment.includes('negative')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Info className="h-4 w-4 text-muted-foreground" />;
  }

  const isLoading = isAnalyzing || isGeneratingDetails;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Response Analysis</CardTitle>
        <CardDescription>Select a job role to auto-generate details, or enter them manually. Then provide the candidate's response for analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Role Selector */}
            <FormField
              control={form.control}
              name="jobRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Job Role (Optional)</FormLabel>
                  <Select onValueChange={handleJobRoleChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job role to generate details..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Selecting a role will generate the description and keywords below.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Description */}
             <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Job Description
                    {isGeneratingDetails && <Sparkles className="h-4 w-4 animate-pulse text-primary" />}
                  </FormLabel>
                  <FormControl>
                    {isGeneratingDetails ? (
                       <Skeleton className="h-20 w-full" />
                    ) : (
                      <Textarea placeholder="Job description will be generated or enter manually..." {...field} disabled={isLoading} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords */}
             <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="flex items-center gap-2">
                    Keywords
                    {isGeneratingDetails && <Sparkles className="h-4 w-4 animate-pulse text-primary" />}
                  </FormLabel>
                  <FormControl>
                     {isGeneratingDetails ? (
                       <Skeleton className="h-10 w-full" />
                     ) : (
                       <Input placeholder="Keywords will be generated or enter manually (comma-separated)..." {...field} disabled={isLoading} />
                     )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Candidate Response */}
            <FormField
              control={form.control}
              name="candidateResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Response</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the candidate's response here..." {...field} disabled={isLoading} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Response'}
            </Button>
          </form>
        </Form>

        {(isAnalyzing || analysisResult) && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAnalyzing ? (
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
                    valueClassName={
                      analysisResult.sentiment?.toLowerCase().includes('positive')
                        ? 'text-green-600'
                        : analysisResult.sentiment?.toLowerCase().includes('negative')
                        ? 'text-red-600'
                        : ''
                    }
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
             {isAnalyzing ? (
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
