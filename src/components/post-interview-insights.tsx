"use client";

import type React from 'react';
import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generatePostInterviewInsights, PostInterviewInsightsOutput } from '@/ai/flows/generate-post-interview-insights';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Brain, Lightbulb, Plus, Trash2, TrendingUp, TrendingDown, ListChecks, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  jobDescription: z.string().min(20, { message: 'Job description must be at least 20 characters.' }),
  candidateResponses: z.array(
    z.object({ value: z.string().min(10, { message: "Response must be at least 10 characters." }) })
  ).min(1, { message: "At least one candidate response is required." }),
});

type FormData = z.infer<typeof formSchema>;

export function PostInterviewInsights() {
  const [insightsResult, setInsightsResult] = useState<PostInterviewInsightsOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: '',
      candidateResponses: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "candidateResponses",
  });

  const onSubmit = (data: FormData) => {
    setInsightsResult(null); // Clear previous results
    startTransition(async () => {
      try {
        const formattedInput = {
          jobDescription: data.jobDescription,
          candidateResponses: data.candidateResponses.map(response => response.value),
        };
        const result = await generatePostInterviewInsights(formattedInput);
        setInsightsResult(result);
         toast({
          title: "Insights Generated",
          description: "Post-interview insights dashboard generated.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error generating insights:", error);
         toast({
          title: "Insight Generation Failed",
          description: "Could not generate post-interview insights. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post-Interview Insights Dashboard</CardTitle>
        <CardDescription>Provide the job description and key candidate responses to generate a structured insights dashboard.</CardDescription>
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
                    <Textarea placeholder="Paste the job description here..." {...field} disabled={isPending} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Candidate Responses</FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`candidateResponses.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <div className="flex items-start gap-2">
                        <FormControl>
                           <Textarea
                            placeholder={`Response ${index + 1}`}
                            {...field}
                            disabled={isPending}
                            rows={3}
                          />
                        </FormControl>
                        {fields.length > 1 && (
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={isPending}
                              className="text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                              aria-label={`Remove response ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: '' })}
                disabled={isPending}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Response
              </Button>
            </div>

            <Button type="submit" disabled={isPending || !form.formState.isValid} className="w-full sm:w-auto">
              {isPending ? 'Generating Dashboard...' : 'Generate Dashboard'}
            </Button>
          </form>
        </Form>

        {(isPending || insightsResult) && (
          <div className="mt-8 space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2 mb-4">Candidate Insights Dashboard</h3>
            {isPending ? (
              <div className="space-y-6">
                 {/* Summary Skeleton */}
                 <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                         <Skeleton className="h-5 w-5 rounded-full" />
                         <Skeleton className="h-5 w-32" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                 </Card>
                 {/* Strengths/Weaknesses Skeleton */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                       <CardHeader>
                         <CardTitle className="text-lg font-semibold flex items-center gap-2">
                           <Skeleton className="h-5 w-5 rounded-full" />
                           <Skeleton className="h-5 w-24" />
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-2">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                       </CardContent>
                    </Card>
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-lg font-semibold flex items-center gap-2">
                           <Skeleton className="h-5 w-5 rounded-full" />
                           <Skeleton className="h-5 w-28" />
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-2">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                       </CardContent>
                    </Card>
                 </div>
                  {/* Skill Assessment Skeleton */}
                  <Card>
                    <CardHeader>
                       <CardTitle className="text-lg font-semibold flex items-center gap-2">
                         <Skeleton className="h-5 w-5 rounded-full" />
                         <Skeleton className="h-5 w-40" />
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {[...Array(3)].map((_, i) => (
                         <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                         </div>
                       ))}
                    </CardContent>
                  </Card>
                  {/* Comparison Points Skeleton */}
                  <Card>
                    <CardHeader>
                       <CardTitle className="text-lg font-semibold flex items-center gap-2">
                         <Skeleton className="h-5 w-5 rounded-full" />
                         <Skeleton className="h-5 w-44" />
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {[...Array(3)].map((_, i) => (
                         <div key={i} className="flex justify-between items-center">
                           <Skeleton className="h-4 w-1/3" />
                           <Skeleton className="h-6 w-1/4 rounded-full" /> {/* Badge Skeleton */}
                         </div>
                       ))}
                    </CardContent>
                  </Card>
              </div>
            ) : insightsResult ? (
              <div className="space-y-6 animate-fadeIn">
                 {/* Overall Summary Card */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="text-lg font-semibold flex items-center gap-2">
                       <Brain className="h-5 w-5 text-primary" />
                       Overall Summary
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-foreground">{insightsResult.overallSummary}</p>
                   </CardContent>
                 </Card>

                 {/* Strengths and Weaknesses Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                         {insightsResult.strengths.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                              {insightsResult.strengths.map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                         ) : (
                            <p className="text-sm text-muted-foreground">No specific strengths highlighted.</p>
                         )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          Weaknesses / Areas for Development
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                         {insightsResult.weaknesses.length > 0 ? (
                           <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                             {insightsResult.weaknesses.map((weakness, index) => (
                               <li key={index}>{weakness}</li>
                             ))}
                           </ul>
                          ) : (
                             <p className="text-sm text-muted-foreground">No specific weaknesses highlighted.</p>
                          )}
                      </CardContent>
                    </Card>
                 </div>

                 {/* Skill Assessment Card */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="text-lg font-semibold flex items-center gap-2">
                       <ListChecks className="h-5 w-5 text-accent" />
                       Skill Assessment
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                      {insightsResult.skillAssessment.length > 0 ? (
                        <div className="space-y-3">
                          {insightsResult.skillAssessment.map((skill, index) => (
                             <div key={index} className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 text-sm">
                                <span className="font-medium text-foreground">{skill.skill}</span>
                                <span className="text-muted-foreground text-left sm:text-right">{skill.assessment}</span>
                             </div>
                          ))}
                        </div>
                       ) : (
                          <p className="text-sm text-muted-foreground">No specific skills assessed.</p>
                       )}
                   </CardContent>
                 </Card>

                 {/* Comparison Points Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-purple-500" />
                        Comparison Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                       {insightsResult.comparisonPoints.length > 0 ? (
                         <div className="space-y-3">
                           {insightsResult.comparisonPoints.map((point, index) => (
                             <div key={index} className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-4 text-sm">
                               <span className="font-medium text-foreground">{point.metric}</span>
                               <Badge variant="secondary" className="whitespace-nowrap self-start sm:self-center">{point.value}</Badge>
                             </div>
                           ))}
                         </div>
                        ) : (
                           <p className="text-sm text-muted-foreground">No specific comparison points generated.</p>
                        )}
                    </CardContent>
                  </Card>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
