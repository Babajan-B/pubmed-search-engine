'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Article } from '@/app/api/search/route';
import type { CitationFormat } from '@/lib/export';
import { exportCSV, exportExcel, exportWord, exportBibTeX } from '@/lib/export';
import ArticleCard from './ArticleCard';
import { TracingBeam } from '@/components/ui/tracing-beam';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sparkles } from 'lucide-react';

const LS_KEY = 'scholarabb_ai_articles';

interface Props {
  articles: Article[] | null;
  loading: boolean;
  totalFound: number;
  fetched: number;
  filtered: number;
  error: string | null;
  query: string;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'jif-desc', label: 'JIF — High to Low' },
  { value: 'jif-asc', label: 'JIF — Low to High' },
  { value: 'quartile-asc', label: 'Quartile Q1 → Q4' },
  { value: 'quartile-desc', label: 'Quartile Q4 → Q1' },
  { value: 'year-desc', label: 'Year — Newest First' },
  { value: 'year-asc', label: 'Year — Oldest First' },
];

function sortArticles(articles: Article[], sortBy: string): Article[] {
  const clone = [...articles];
  if (sortBy === 'jif-desc') return clone.sort((a, b) => (b.jif ?? 0) - (a.jif ?? 0));
  if (sortBy === 'jif-asc') return clone.sort((a, b) => (a.jif ?? 0) - (b.jif ?? 0));
  if (sortBy === 'quartile-asc') {
    const o: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    return clone.sort((a, b) => (o[a.quartile ?? ''] ?? 9) - (o[b.quartile ?? ''] ?? 9));
  }
  if (sortBy === 'quartile-desc') {
    const o: Record<string, number> = { Q4: 1, Q3: 2, Q2: 3, Q1: 4 };
    return clone.sort((a, b) => (o[a.quartile ?? ''] ?? 9) - (o[b.quartile ?? ''] ?? 9));
  }
  if (sortBy === 'year-desc') return clone.sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
  if (sortBy === 'year-asc') return clone.sort((a, b) => parseInt(a.year || '0') - parseInt(b.year || '0'));
  return clone;
}

export default function ResultsPanel({
  articles,
  loading,
  totalFound,
  fetched,
  filtered,
  error,
  query,
}: Props) {
  const router = useRouter();
  const [citationFormat, setCitationFormat] = useState<CitationFormat>('vancouver');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedPmids, setSelectedPmids] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const sortedArticles = useMemo(
    () => (articles ? sortArticles(articles, sortBy) : null),
    [articles, sortBy]
  );

  const toggleArticle = (pmid: string) => {
    setSelectedPmids((prev) => {
      const next = new Set(prev);
      if (next.has(pmid)) next.delete(pmid);
      else next.add(pmid);
      return next;
    });
  };

  const selectAll = () => {
    if (!sortedArticles) return;
    setSelectedPmids(new Set(sortedArticles.map((a) => a.pmid)));
  };

  const deselectAll = () => setSelectedPmids(new Set());
  const allSelected = sortedArticles ? selectedPmids.size === sortedArticles.length : false;

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

  const exportTarget = selectedPmids.size > 0
    ? (sortedArticles ?? []).filter((a) => selectedPmids.has(a.pmid))
    : (sortedArticles ?? []);

  const handleExport = async (format: 'csv' | 'excel' | 'word' | 'bibtex') => {
    setExporting(true);
    try {
      if (format === 'csv') exportCSV(exportTarget, citationFormat, query);
      else if (format === 'excel') await exportExcel(exportTarget, citationFormat, query);
      else if (format === 'word') await exportWord(exportTarget, citationFormat, query);
      else if (format === 'bibtex') exportBibTeX(exportTarget, query);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleAISummary = () => {
    const aiTarget = selectedPmids.size > 0
      ? (sortedArticles ?? []).filter((a) => selectedPmids.has(a.pmid))
      : (sortedArticles ?? []);

    localStorage.setItem(LS_KEY, JSON.stringify({
      articles: aiTarget,
      query,
      citationFormat,
    }));
    router.push('/ai-summary');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        {/* Row 1 — counts + sort */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>PubMed total: <strong className="text-foreground">{totalFound.toLocaleString()}</strong></span>
            <span>Fetched: <strong className="text-foreground">{fetched}</strong></span>
            <span>Showing: <strong className="text-primary">{filtered}</strong></span>
            {selectedPmids.size > 0 && (
              <span className="text-indigo-400 font-medium">{selectedPmids.size} selected</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2 — selection + citation + export */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-2"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          {selectedPmids.size > 0 && (
            <button onClick={deselectAll} className="text-xs text-muted-foreground hover:text-foreground transition">
              · Clear
            </button>
          )}

          <span className="text-xs text-muted-foreground ml-1">Citation:</span>
          <Select value={citationFormat} onValueChange={(v) => setCitationFormat(v as CitationFormat)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vancouver">Vancouver / NLM</SelectItem>
              <SelectItem value="apa">APA 7th</SelectItem>
              <SelectItem value="ama">AMA</SelectItem>
              <SelectItem value="bibtex">BibTeX</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 ml-auto flex-wrap">
            <span className="text-xs text-muted-foreground self-center">
              Export {selectedPmids.size > 0 ? `${selectedPmids.size} selected` : 'all'}:
            </span>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={exporting} className="text-xs h-8">
              {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting} className="text-xs h-8">
              {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
              Excel
            </Button>
            {citationFormat !== 'bibtex' ? (
              <Button variant="outline" size="sm" onClick={() => handleExport('word')} disabled={exporting} className="text-xs h-8">
                {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                Word
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleExport('bibtex')} disabled={exporting} className="text-xs h-8">
                {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                BibTeX
              </Button>
            )}

            {/* AI Summary button */}
            <Button
              size="sm"
              onClick={handleAISummary}
              className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Summary {selectedPmids.size > 0 ? `(${selectedPmids.size})` : `(all ${(sortedArticles ?? []).length})`}
            </Button>
          </div>
        </div>
      </div>

      <TracingBeam className="px-0">
        <div className="space-y-3">
          {(sortedArticles ?? []).map((article) => (
            <ArticleCard
              key={article.pmid}
              article={article}
              selected={selectedPmids.has(article.pmid)}
              onToggle={toggleArticle}
            />
          ))}
        </div>
      </TracingBeam>
    </div>
  );
}
