"use client";

import type React from 'react';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { analyzeCandidateResponse, AnalyzeCandidateResponseOutput } from '@/ai/flows/analyze-candidate-response';
import { generateJobDetails } from '@/ai/flows/generate-job-details'; // Import only the function
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AnalysisCard } from '@/components/analysis-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { AlertCircle, CheckCircle, Info, Smile, Speech, ThumbsUp, Sparkles, Upload, Video, X, FileVideo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi']; // Common video MIME types

// Schema only includes fields sent to the AI flow
const formSchema = z.object({
  jobRole: z.string().optional(),
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  useEffect(() => {
    if (selectedJobRole) {
      form.setValue('jobDescription', '');
      form.setValue('keywords', '');
      setAnalysisResult(null);

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

  const handleFileValidation = (file: File | null): boolean => {
    if (!file) {
      setVideoError(null);
      return true;
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setVideoError(`Invalid file type. Please upload a video (${ACCEPTED_VIDEO_TYPES.map(t => t.split('/')[1]).join(', ')}).`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setVideoError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return false;
    }

    setVideoError(null);
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (handleFileValidation(file)) {
      setVideoFile(file);
    } else {
      setVideoFile(null);
      event.target.value = ''; // Clear the input
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] || null;
    if (handleFileValidation(file)) {
      setVideoFile(file);
    } else {
      setVideoFile(null);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the leave target is outside the drop zone
     if (event.currentTarget.contains(event.relatedTarget as Node)) {
       return;
     }
    setIsDragging(false);
  }, []);

  const removeVideoFile = () => {
    setVideoFile(null);
    setVideoError(null);
    // Reset the file input visually if possible (difficult to do reliably across browsers)
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const handleJobRoleChange = (value: string) => {
    setSelectedJobRole(value);
    form.setValue('jobRole', value);
  };

  const onSubmit = (data: FormData) => {
    // Only send form data relevant to the AI flow
    setAnalysisResult(null);
    startAnalysisTransition(async () => {
      try {
        const result = await analyzeCandidateResponse({
          candidateResponse: data.candidateResponse,
          jobDescription: data.jobDescription,
          keywords: data.keywords,
        });
        setAnalysisResult(result);
        toast({
          title: "Analysis Complete",
          description: "Candidate text response analyzed successfully.",
          variant: "default",
        });
        // Note: The video file (videoFile state) is not sent for analysis here.
      } catch (error) {
        console.error("Error analyzing response:", error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the candidate text response. Please try again.",
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
        <CardDescription>Select a job role to auto-generate details, or enter them manually. Then provide the candidate's text response for analysis and optionally upload a video response.</CardDescription>
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

            {/* Candidate Text Response */}
            <FormField
              control={form.control}
              name="candidateResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Text Response (for AI Analysis)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the candidate's text response here..." {...field} disabled={isLoading} rows={5} />
                  </FormControl>
                  <FormDescription>This text will be analyzed by the AI.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Video Upload Section */}
             <FormItem>
                <FormLabel>Candidate Video Response (Optional)</FormLabel>
                <FormControl>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors",
                            isDragging ? "border-primary bg-primary/10" : "border-input",
                            videoError ? "border-destructive" : ""
                        )}
                    >
                        <Input
                            id="video-upload"
                            type="file"
                            className="hidden"
                            accept={ACCEPTED_VIDEO_TYPES.join(',')}
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                        <label
                            htmlFor="video-upload"
                            className={cn("flex flex-col items-center justify-center w-full h-full cursor-pointer", isLoading ? "cursor-not-allowed opacity-50" : "")}
                        >
                          {videoFile ? (
                            <div className="flex flex-col items-center text-center p-2">
                              <FileVideo className="h-8 w-8 text-primary mb-2" />
                              <p className="text-sm font-medium text-foreground truncate max-w-xs">{videoFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                               <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-destructive hover:bg-destructive/10"
                                  onClick={(e) => { e.preventDefault(); removeVideoFile(); }} // Prevent form submission
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4 mr-1" /> Remove
                               </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                              <Upload className={cn("w-8 h-8 mb-3", isDragging ? "text-primary" : "text-muted-foreground")} />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className={cn("font-semibold", isDragging ? "text-primary" : "text-foreground")}>Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">Video (MP4, WEBM, MOV, AVI - Max {MAX_FILE_SIZE_MB}MB)</p>
                            </div>
                          )}
                        </label>
                    </div>
                </FormControl>
                {videoError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Upload Error</AlertTitle>
                      <AlertDescription>{videoError}</AlertDescription>
                    </Alert>
                )}
                 <FormDescription>Upload the candidate's video response for review (video is not sent for AI analysis).</FormDescription>
             </FormItem>


            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isAnalyzing ? 'Analyzing Text...' : 'Analyze Text Response'}
            </Button>
          </form>
        </Form>

        {(isAnalyzing || analysisResult) && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Text Analysis Results</h3>
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
                      Overall Text Assessment
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
