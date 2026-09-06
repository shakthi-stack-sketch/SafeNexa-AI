import React from 'react';
import { SearchCheck, Lightbulb } from 'lucide-react';

interface EvidencePanelProps {
  originalText?: string;
  evidenceTokens?: string[];
  evidence?: string[];
  explanation?: string;
}

export function EvidencePanel({
  originalText = '',
  evidenceTokens,
  evidence,
  explanation = '',
}: EvidencePanelProps) {
  const activeTokens = evidenceTokens || evidence || [];

  // Highlight evidence tokens inside original text
  const renderHighlightedText = () => {
    if (!activeTokens || activeTokens.length === 0) {
      return <span>{originalText}</span>;
    }

    // Escape regex characters
    const escaped = activeTokens
      .filter((t) => t.trim().length > 0)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    if (!escaped) return <span>{originalText}</span>;

    try {
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = originalText.split(regex);

      return (
        <span className="leading-relaxed">
          {parts.map((part, index) => {
            const isMatch = activeTokens.some(
              (token) => token.toLowerCase() === part.toLowerCase()
            );
            return isMatch ? (
              <mark
                key={index}
                className="bg-accent/25 text-content-primary px-1.5 py-0.5 rounded font-semibold border-b-2 border-accent inline"
              >
                {part}
              </mark>
            ) : (
              <span key={index}>{part}</span>
            );
          })}
        </span>
      );
    } catch {
      return <span>{originalText}</span>;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-bg-primary border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
          <SearchCheck className="w-4 h-4 text-accent" />
          <span>Evidence & Grounded Text Spans</span>
        </div>
        <span className="text-[11px] text-content-muted">
          {activeTokens.length} key evidence marker{activeTokens.length === 1 ? '' : 's'} identified
        </span>
      </div>

      {/* Highlighted text block */}
      <div className="p-4 rounded-xl bg-bg-secondary/70 border border-border text-sm text-content-primary leading-relaxed">
        {renderHighlightedText()}
      </div>

      {/* Extracted Evidence Chips */}
      {activeTokens.length > 0 && (
        <div>
          <div className="text-xs font-medium text-content-muted mb-2">
            Identified Risk Signals:
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTokens.map((token, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-bg-elevated border border-accent/25 text-xs text-accent font-mono"
              >
                &ldquo;{token}&rdquo;
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Why this was flagged card */}
      <div className="p-4 rounded-xl bg-bg-elevated/60 border border-border flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold uppercase tracking-wider text-content-primary">
            Why This Was Flagged
          </div>
          <p className="text-content-secondary leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
