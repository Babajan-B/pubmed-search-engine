'use client';

import { useState, useCallback, type ReactNode } from 'react';
import SearchForm, { type SearchParams } from '@/components/SearchForm';
import JournalResultsPanel from '@/components/JournalResultsPanel';
import ScopusJournalPanel from '@/components/ScopusJournalPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Article } from '@/app/api/search/route';

interface SearchResult {
  articles: Article[];
  totalFound: number;
  fetched: number;
  filtered: number;
}

interface JournalMatch {
  name: string;
  jif: number | null;
  quartile: string | null;
  category: string | null;
  articleCount: number;
}

interface ScopusJournalEntry {
  sourceRecordId: string | null;
  title: string;
  rank?: number | null;
  issn: string | null;
  eissn: string | null;
  status: string | null;
  coverage: string | null;
  sourceType: string | null;
  publisher: string | null;
  asjcCodes: string[];
  topLevelSubjects: string[];
  subjects: string[];
}

interface ScopusSearchResult {
  journals: ScopusJournalEntry[];
  totalMatches: number;
  returned: number;
}

function SourceLabel({ children, tone }: { children: ReactNode; tone: 'pubmed' | 'scopus' }) {
  const classes = tone === 'pubmed'
    ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300'
    : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${classes}`}>
      {children}
    </span>
  );
}

function ScopusSearchResults({ result, loading, error }: {
  result: ScopusSearchResult | null;
  loading: boolean;
  error: string | null;
}) {
  const hasRank = result?.journals.some((journal) => journal.rank !== null && journal.rank !== undefined) ?? false;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
        <SourceLabel tone="scopus">Scopus</SourceLabel>
        <h2 className="text-sm font-semibold text-foreground">Scopus Journal List Results</h2>
        {result && (
          <span className="ml-auto text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{result.returned.toLocaleString()}</strong> of{' '}
            <strong className="text-primary">{result.totalMatches.toLocaleString()}</strong>
          </span>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
          Searching Scopus journal list...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && result?.journals.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
          No Scopus journals matched this query.
        </div>
      )}

      {!loading && !error && result && result.journals.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="w-8 px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
                {hasRank && <th className="w-20 px-3 py-2.5 text-center font-medium text-muted-foreground">Rank</th>}
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Journal</th>
                <th className="w-32 px-3 py-2.5 text-left font-medium text-muted-foreground">ISSN</th>
                <th className="w-28 px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="w-32 px-3 py-2.5 text-left font-medium text-muted-foreground">Coverage</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Subject</th>
              </tr>
            </thead>
            <tbody>
              {result.journals.map((journal, index) => (
                <tr key={`${journal.sourceRecordId}-${journal.title}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground/40">{index + 1}</td>
                  {hasRank && (
                    <td className="px-3 py-3 text-center tabular-nums text-foreground/80">
                      {journal.rank ?? '-'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium leading-snug text-foreground/90">{journal.title}</div>
                    <div className="mt-1 max-w-md truncate text-[10px] text-muted-foreground/50">
                      {journal.publisher ?? 'Unknown publisher'}
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">
                    <div>{journal.issn ?? '-'}</div>
                    {journal.eissn && <div className="text-muted-foreground/50">{journal.eissn}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      journal.status === 'Active'
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                        : 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300'
                    }`}>
                      {journal.status ?? 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{journal.coverage ?? '-'}</td>
                  <td className="px-3 py-3">
                    <div className="max-w-xs text-foreground/80">{journal.subjects[0] ?? journal.topLevelSubjects[0] ?? '-'}</div>
                    {journal.asjcCodes.length > 0 && (
                      <div className="mt-1 text-[10px] text-muted-foreground/50">
                        ASJC {journal.asjcCodes.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && result && !hasRank && (
        <p className="text-xs text-muted-foreground">
          Ranking is not available in the loaded Scopus March 2026 source list.
        </p>
      )}
    </section>
  );
}

export default function JournalsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [journalMatches, setJournalMatches] = useState<JournalMatch[]>([]);
  const [scopusResult, setScopusResult] = useState<ScopusSearchResult | null>(null);
  const [scopusError, setScopusError] = useState<string | null>(null);
  const [searchBothLists, setSearchBothLists] = useState(true);
  const [scopusSortBy, setScopusSortBy] = useState('title-asc');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setScopusError(null);
    setResult(null);
    setJournalMatches([]);
    setScopusResult(null);
    setHasSearched(true);
    setLastQuery(params.query);

    const qs = new URLSearchParams({
      query: params.query,
      articleType: params.articleType,
      humansOnly: String(params.humansOnly),
      accessFilter: params.accessFilter,
      authorCountry: params.authorCountry,
      yearsBack: String(params.yearsBack),
      maxResults: String(params.maxResults),
      showAllJournals: String(params.showAllJournals),
      sortBy: params.sortBy,
    });

    try {
      const [articleRes, journalRes, scopusRes] = await Promise.all([
        fetch(`/api/search?${qs}`),
        fetch(`/api/journals?${new URLSearchParams({ query: params.query, limit: '100' })}`),
        searchBothLists
          ? fetch(`/api/scopus-journals?${new URLSearchParams({
              query: params.query,
              status: 'Active',
              sourceType: 'Journal',
              subject: 'all',
              sortBy: scopusSortBy,
              limit: '100',
            })}`)
          : Promise.resolve(null),
      ]);

      const articleData = await articleRes.json();
      if (!articleRes.ok) {
        setError(articleData.error ?? 'An unexpected error occurred.');
        return;
      }
      setResult(articleData as SearchResult);

      if (journalRes.ok) {
        const journalData = await journalRes.json();
        setJournalMatches(
          (journalData.journals ?? []).map((journal: Omit<JournalMatch, 'articleCount'>) => ({
            ...journal,
            articleCount: 0,
          })),
        );
      }

      if (searchBothLists && scopusRes) {
        const scopusData = await scopusRes.json();
        if (scopusRes.ok) {
          setScopusResult({
            journals: scopusData.journals ?? [],
            totalMatches: scopusData.totalMatches ?? 0,
            returned: scopusData.returned ?? 0,
          });
        } else {
          setScopusError(scopusData.error ?? 'Unable to search the Scopus journal list.');
        }
      }
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [searchBothLists, scopusSortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <span className="text-xl">🔬</span>
          <span className="font-semibold tracking-tight text-sm">ScholaraBB</span>
          <nav className="flex items-center gap-1 ml-4">
            <a
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            >
              Articles
            </a>
            <a
              href="/journals"
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-foreground bg-white/10 border border-white/15 transition"
            >
              Journal View
            </a>
          </nav>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
            JIF 2024 · All disciplines
          </span>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="relative pt-16 pb-10 px-4 overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="mt-8 h-[400px] w-[800px] rounded-full bg-violet-600/10 blur-[110px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6 text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Journal Impact · Quartile Rankings · Topic Groups
          </div>

          {/* headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Journal View
              </span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Search PubMed and see results ranked by journal — with JIF, quartile, and keyword topic groups.
            </p>
          </div>

          {/* Search form */}
          <div className="text-left">
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchBothLists(false)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    !searchBothLists
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  PubMed only
                </button>
                <button
                  type="button"
                  onClick={() => setSearchBothLists(true)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    searchBothLists
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  PubMed + Scopus
                </button>
              </div>
              {searchBothLists && (
                <div className="mt-2 border-t border-white/10 pt-2">
                  <Select value={scopusSortBy} onValueChange={setScopusSortBy}>
                    <SelectTrigger className="h-9 w-full bg-white/5 text-xs">
                      <SelectValue placeholder="Sort Scopus results" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title-asc">Scopus sort: Title A-Z</SelectItem>
                      <SelectItem value="title-desc">Scopus sort: Title Z-A</SelectItem>
                      <SelectItem value="coverage-desc">Scopus sort: Coverage newest</SelectItem>
                      <SelectItem value="coverage-asc">Scopus sort: Coverage oldest</SelectItem>
                      <SelectItem value="publisher">Scopus sort: Publisher</SelectItem>
                      <SelectItem value="status">Scopus sort: Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <SearchForm
              onSearch={handleSearch}
              loading={loading}
              defaultParams={{ maxResults: 100 }}
            />
          </div>

          {/* Stats row — only when not yet searched */}
          {!hasSearched && (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[
                { label: 'Journal Name', sub: 'full title' },
                { label: 'Q1 – Q4', sub: 'quartile rank' },
                { label: 'JIF 2024', sub: 'impact factor' },
                { label: 'By Topic', sub: 'keyword groups' },
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16">
        <Tabs defaultValue="pubmed" className="w-full">
          <TabsList className="mb-5 grid h-auto w-full grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <TabsTrigger value="pubmed" className="rounded-lg text-xs sm:text-sm">
              PubMed Journal View
            </TabsTrigger>
            <TabsTrigger value="scopus" className="rounded-lg text-xs sm:text-sm">
              Scopus Journal List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pubmed" className="mt-0">
            {hasSearched ? (
              <div className="space-y-7">
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceLabel tone="pubmed">PubMed</SourceLabel>
                    <h2 className="text-sm font-semibold text-foreground">PubMed Journal Results</h2>
                    <span className="text-xs text-muted-foreground">articles ranked by journal metadata</span>
                  </div>
                  <JournalResultsPanel
                    articles={result?.articles ?? null}
                    journalMatches={journalMatches}
                    loading={loading}
                    totalFound={result?.totalFound ?? 0}
                    fetched={result?.fetched ?? 0}
                    filtered={result?.filtered ?? 0}
                    error={error}
                    searchQuery={lastQuery}
                  />
                </section>

                {searchBothLists && (
                  <ScopusSearchResults
                    result={scopusResult}
                    loading={loading}
                    error={scopusError}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
                Search above to rank PubMed journal results and optionally match the Scopus journal list.
              </div>
            )}
          </TabsContent>

          <TabsContent value="scopus" className="mt-0">
            <ScopusJournalPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-5 text-center text-xs text-muted-foreground mt-auto">
        Data: PubMed / NCBI · Journal Impact Factors 2024 · Scopus source list Mar 2026 ·{' '}
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
