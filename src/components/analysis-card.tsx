import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalysisCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: React.ElementType;
  className?: string;
  valueClassName?: string;
}

export function AnalysisCard({ title, value, icon: Icon, className, valueClassName }: AnalysisCardProps) {
  return (
    <Card className={cn("animate-fadeIn", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-lg font-semibold", valueClassName)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
