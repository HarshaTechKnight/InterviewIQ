import { BrainCircuit } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b p-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex items-center gap-2">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">InterviewIQ</h1>
      </div>
    </header>
  );
}
