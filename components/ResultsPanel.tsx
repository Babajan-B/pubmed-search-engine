'use client';

import type { Article } from '@/app/api/search/route';
import ArticleCard from './ArticleCard';
import { TracingBeam } from '@/components/ui/tracing-beam';

interface Props {
  articles: Article[] | null;
  loading: boolean;
  totalFound: number;
  fetched: number;
  filtered: number;
  error: string | null;
}

export default function ResultsPanel({
  articles,
  loading,
  totalFound,
  fetched,
  filtered,
  error,
}: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 text-muted-foreground">
        <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm">Searching PubMed…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (articles === null) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground text-sm space-y-2">
        <svg className="h-10 w-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <p>Enter a query and click <span className="text-primary">Search PubMed</span> to get started.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm space-y-1">
        <p className="font-medium text-foreground">No matching articles found.</p>
        <p>Try broadening your query, increasing Years Back, or enabling &quot;Show All Journals&quot;.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pb-2 border-b border-border">
        <span>PubMed total: <strong className="text-foreground">{totalFound.toLocaleString()}</strong></span>
        <span>Fetched: <strong className="text-foreground">{fetched}</strong></span>
        <span>Showing: <strong className="text-primary">{filtered}</strong></span>
      </div>

      <TracingBeam className="px-0">
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard key={article.pmid} article={article} />
          ))}
        </div>
      </TracingBeam>
    </div>
  );
}
