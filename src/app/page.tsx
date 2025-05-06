import { Header } from '@/components/header';
import { ResponseAnalysis } from '@/components/response-analysis';
import { PostInterviewInsights } from '@/components/post-interview-insights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="realtime">Real-time Analysis</TabsTrigger>
            <TabsTrigger value="post-interview">Post-Interview Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="realtime">
             <ResponseAnalysis />
          </TabsContent>
          <TabsContent value="post-interview">
            <PostInterviewInsights />
          </TabsContent>
        </Tabs>
      </main>
       <footer className="py-4 border-t bg-card">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} InterviewIQ. All rights reserved.
          </div>
       </footer>
    </div>
  );
}
