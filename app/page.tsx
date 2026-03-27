'use client';

import { useState, useCallback } from 'react';
import SearchForm, { type SearchParams } from '@/components/SearchForm';
import ResultsPanel from '@/components/ResultsPanel';
import type { Article } from '@/app/api/search/route';

interface SearchResult {
  articles: Article[];
  totalFound: number;
  fetched: number;
  filtered: number;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    const qs = new URLSearchParams({
      query: params.query,
      articleType: params.articleType,
      humansOnly: String(params.humansOnly),
      openAccess: String(params.openAccess),
      yearsBack: String(params.yearsBack),
      maxResults: String(params.maxResults),
      showAllJournals: String(params.showAllJournals),
      sortBy: params.sortBy,
    });

    try {
      const res = await fetch(`/api/search?${qs}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'An unexpected error occurred.'); return; }
      setResult(data as SearchResult);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <span className="text-xl">🔬</span>
          <span className="font-semibold tracking-tight text-sm">ScholaraBB</span>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            High-impact journals · JIF 2024 · All disciplines
          </span>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="relative pt-16 pb-10 px-4 overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="mt-8 h-[400px] w-[800px] rounded-full bg-indigo-600/10 blur-[110px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6 text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by PubMed · NCBI E-utilities
          </div>

          {/* headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ScholaraBB
              </span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Search PubMed and filter by Journal Impact Factor, quartile rankings,
              and more — across every discipline.
            </p>
          </div>

          {/* Search form */}
          <div className="text-left">
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>

          {/* Stats row — only when not yet searched */}
          {!hasSearched && (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[
                { label: '7 000+', sub: 'indexed journals' },
                { label: 'Q1 – Q4', sub: 'quartile rankings' },
                { label: 'JIF 2024', sub: 'impact factors' },
                { label: 'All fields', sub: 'cross-discipline' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {hasSearched && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16">
          <ResultsPanel
            articles={result?.articles ?? null}
            loading={loading}
            totalFound={result?.totalFound ?? 0}
            fetched={result?.fetched ?? 0}
            filtered={result?.filtered ?? 0}
            error={error}
          />
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-5 text-center text-xs text-muted-foreground mt-auto">
        Data: PubMed / NCBI · Journal Impact Factors 2024 ·{' '}
        <a
          href="https://github.com/jaannawaz/pubmed-search-engine"
          className="hover:text-foreground transition"
          target="_blank" rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
