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
import { BarChart, Brain, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          description: "Post-interview insights and metrics generated.",
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
        <CardTitle>Post-Interview Insights Generation</CardTitle>
        <CardDescription>Provide the job description and key candidate responses to generate insights and comparison metrics.</CardDescription>
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

            <div>
              <FormLabel>Candidate Responses</FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`candidateResponses.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <div className="flex items-center gap-2">
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
                              className="text-destructive hover:bg-destructive/10"
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

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Generating...' : 'Generate Insights'}
            </Button>
          </form>
        </Form>

        {(isPending || insightsResult) && (
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold">Generated Insights & Metrics</h3>
            {isPending ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : insightsResult ? (
              <>
                <Card className="animate-fadeIn">
                  <CardHeader>
                     <CardTitle className="text-base font-semibold flex items-center gap-2">
                       <Lightbulb className="h-4 w-4 text-accent" />
                       Key Insights
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{insightsResult.insights}</p>
                  </CardContent>
                </Card>
                <Card className="animate-fadeIn">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                       <BarChart className="h-4 w-4 text-primary" />
                      Comparison Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-foreground whitespace-pre-wrap">{insightsResult.comparisonMetrics}</p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
