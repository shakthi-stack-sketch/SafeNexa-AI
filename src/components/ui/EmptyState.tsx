import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-content-muted mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-content-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-content-muted max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
