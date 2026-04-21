'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SearchParams = {
  query: string;
  articleType: string;
  humansOnly: boolean;
  accessFilter: 'all' | 'open' | 'closed';
  yearsBack: number;
  maxResults: number;
  showAllJournals: boolean;
  sortBy: string;
};

const ARTICLE_TYPES = [
  { value: '', label: 'Any type' },
  { value: 'Research Article', label: 'Research Article' },
  { value: 'Randomized Controlled Trial', label: 'Randomized Controlled Trial' },
  { value: 'Meta-Analysis', label: 'Meta-Analysis' },
  { value: 'Systematic Review', label: 'Systematic Review' },
  { value: 'Clinical Trial', label: 'Clinical Trial' },
  { value: 'Review', label: 'Review' },
  { value: 'Case Report', label: 'Case Report' },
  { value: 'Observational Study', label: 'Observational Study' },
  { value: 'Cohort Study', label: 'Cohort Study' },
  { value: 'Editorial', label: 'Editorial' },
  { value: 'Letter', label: 'Letter' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'jif-desc', label: 'JIF — High to Low' },
  { value: 'jif-asc', label: 'JIF — Low to High' },
  { value: 'quartile-asc', label: 'Quartile Q1 → Q4' },
  { value: 'quartile-desc', label: 'Quartile Q4 → Q1' },
];

const EXAMPLES = [
  'machine learning radiology',
  'climate change mental health',
  'GLP-1 obesity meta-analysis',
  'CRISPR gene therapy',
  'antibiotic resistance',
];

interface Props {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
  defaultParams?: Partial<SearchParams>;
}

const BASE_DEFAULT_PARAMS: SearchParams = {
  query: '',
  articleType: '',
  humansOnly: false,
  accessFilter: 'all',
  yearsBack: 5,
  maxResults: 20,
  showAllJournals: false,
  sortBy: 'relevance',
};

export default function SearchForm({ onSearch, loading, defaultParams }: Props) {
  const initialParams: SearchParams = {
    ...BASE_DEFAULT_PARAMS,
    ...defaultParams,
  };

  const [params, setParams] = useState<SearchParams>({
    query: '',
    articleType: '',
    humansOnly: false,
    accessFilter: 'all',
    yearsBack: 5,
    maxResults: 20,
    showAllJournals: false,
    sortBy: 'relevance',
    ...defaultParams,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [params.query]);

  function set<K extends keyof SearchParams>(key: K, value: SearchParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!params.query.trim()) return;
    onSearch(params);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (params.query.trim()) onSearch(params);
    }
  }

  const activeFilterCount = [
    params.articleType !== initialParams.articleType,
    params.humansOnly,
    params.accessFilter !== initialParams.accessFilter,
    params.showAllJournals,
    params.yearsBack !== initialParams.yearsBack,
    params.maxResults !== initialParams.maxResults,
    params.sortBy !== initialParams.sortBy,
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Main search box */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 shadow-2xl ring-1 ring-white/5 focus-within:ring-indigo-500/40 focus-within:border-indigo-500/40 transition-all duration-300">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Search PubMed… e.g. machine learning radiology"
          value={params.query}
          onChange={(e) => set('query', e.target.value)}
          onKeyDown={handleKeyDown}
          required
          autoComplete="off"
          className="w-full resize-none bg-transparent px-5 pt-4 pb-3 text-base text-foreground placeholder:text-muted-foreground/50 outline-none min-h-[56px] max-h-40"
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 gap-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1.5 hover:bg-white/5"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="submit"
            disabled={loading || !params.query.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 transition-colors duration-150 shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Searching
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                </svg>
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-[11px] text-muted-foreground/50 mr-0.5">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => set('query', ex)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Article Type</Label>
              <Select value={params.articleType} onValueChange={(v) => set('articleType', v === '__any__' ? '' : v)}>
                <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 text-sm">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_TYPES.map((t) => (
                    <SelectItem key={t.value || '__any__'} value={t.value || '__any__'}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Sort By</Label>
              <Select value={params.sortBy} onValueChange={(v) => set('sortBy', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 text-sm">
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

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Years Back</Label>
            <div className="flex gap-2">
              {[1, 3, 5, 10, 20].map((y) => (
                <button key={y} type="button" onClick={() => set('yearsBack', y)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                    params.yearsBack === y
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  }`}
                >{y}y</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Max Results</Label>
            <div className="flex gap-2">
              {[10, 20, 50, 100, 150].map((n) => (
                <button key={n} type="button" onClick={() => set('maxResults', n)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                    params.maxResults === n
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { key: 'humansOnly', label: 'Humans only', icon: '👤' },
              { key: 'showAllJournals', label: 'All journals', icon: '📄' },
            ] as { key: keyof SearchParams; label: string; icon: string }[]).map(({ key, label, icon }) => (
              <button key={key} type="button"
                onClick={() => set(key, !(params[key]) as SearchParams[typeof key])}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all text-left ${
                  params[key]
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                <span className="text-sm leading-none">{icon}</span>
                <span>{label}</span>
                {params[key] && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Access filter 3-way */}
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Access</Label>
            <div className="flex gap-2">
              {([
                { value: 'all',    label: 'All',               icon: '📋' },
                { value: 'open',   label: 'Open Access',        icon: '🔓' },
                { value: 'closed', label: 'Subscription only',  icon: '🔒' },
              ] as { value: 'all' | 'open' | 'closed'; label: string; icon: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('accessFilter', opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                    params.accessFilter === opt.value
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                  <span className="sm:hidden">{opt.value === 'all' ? 'All' : opt.value === 'open' ? 'Open' : 'Sub'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
