import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  stepMessage?: string;
}

export function LoadingState({
  message = 'Analyzing report...',
  stepMessage,
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-bg-primary border border-border text-center">
      <div className="w-12 h-12 rounded-2xl bg-bg-secondary border border-accent/30 flex items-center justify-center text-accent mb-4 shadow-subtle">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
      <h4 className="text-base font-semibold text-content-primary mb-1">
        {message}
      </h4>
      {stepMessage && (
        <p className="text-xs text-content-muted font-mono animate-pulse max-w-sm">
          {stepMessage}
        </p>
      )}
    </div>
  );
}
