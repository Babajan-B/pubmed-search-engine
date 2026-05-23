'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  medline: string | null;
  openAccess: string | null;
}

interface ScopusResponse {
  journals: ScopusJournalEntry[];
  totalMatches: number;
  returned: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    sourceTypes: Array<{ value: string; count: number }>;
  };
  subjects: string[];
}

export default function ScopusJournalPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('Active');
  const [sourceType, setSourceType] = useState('Journal');
  const [subject, setSubject] = useState('all');
  const [sortBy, setSortBy] = useState('title-asc');
  const [data, setData] = useState<ScopusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      query: debouncedQuery,
      status,
      sourceType,
      subject,
      sortBy,
      limit: '100',
    });

    setLoading(true);
    setError(null);

    fetch(`/api/scopus-journals?${params}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Unable to load Scopus journals.');
        setData(body as ScopusResponse);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message ?? 'Unable to load Scopus journals.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, status, sourceType, subject, sortBy]);

  const subjectOptions = useMemo(() => data?.subjects ?? [], [data]);
  const sourceTypes = data?.stats.sourceTypes ?? [];
  const hasRank = data?.journals.some((journal) => journal.rank !== null && journal.rank !== undefined) ?? false;
  const columnCount = hasRank ? 8 : 7;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_150px_160px] lg:grid-cols-[1fr_150px_160px_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, ISSN, publisher, subject, ASJC"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger>
            <SelectValue placeholder="Source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {sourceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All subjects</SelectItem>
            {subjectOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Sort Scopus list" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title-asc">Sort: Title A-Z</SelectItem>
            <SelectItem value="title-desc">Sort: Title Z-A</SelectItem>
            <SelectItem value="coverage-desc">Sort: Coverage newest</SelectItem>
            <SelectItem value="coverage-asc">Sort: Coverage oldest</SelectItem>
            <SelectItem value="publisher">Sort: Publisher</SelectItem>
            <SelectItem value="status">Sort: Status</SelectItem>
            {hasRank && <SelectItem value="rank-asc">Sort: Rank best first</SelectItem>}
          </SelectContent>
        </Select>
        {!hasRank && (
          <span className="text-xs text-muted-foreground">
            This Scopus source list does not include a ranking metric.
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-b border-border pb-3 text-xs text-muted-foreground">
        <span>Total sources: <strong className="text-foreground">{(data?.stats.total ?? 0).toLocaleString()}</strong></span>
        <span>Active: <strong className="text-foreground">{(data?.stats.active ?? 0).toLocaleString()}</strong></span>
        <span>Inactive: <strong className="text-foreground">{(data?.stats.inactive ?? 0).toLocaleString()}</strong></span>
        <span>Matches: <strong className="text-primary">{(data?.totalMatches ?? 0).toLocaleString()}</strong></span>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[920px] text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="w-8 px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
              {hasRank && <th className="w-20 px-3 py-2.5 text-center font-medium text-muted-foreground">Rank</th>}
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Source</th>
              <th className="w-32 px-3 py-2.5 text-left font-medium text-muted-foreground">ISSN</th>
              <th className="w-28 px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
              <th className="w-32 px-3 py-2.5 text-left font-medium text-muted-foreground">Coverage</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Subject</th>
              <th className="w-28 px-3 py-2.5 text-left font-medium text-muted-foreground">ASJC</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-muted-foreground">
                  Loading Scopus list...
                </td>
              </tr>
            )}

            {!loading && data?.journals.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-muted-foreground">
                  No Scopus journals match the current filters.
                </td>
              </tr>
            )}

            {!loading && data?.journals.map((journal, index) => (
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
                  {journal.topLevelSubjects.length > 0 && (
                    <div className="mt-1 text-[10px] text-muted-foreground/50">
                      {journal.topLevelSubjects.join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{journal.asjcCodes.slice(0, 3).join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalMatches > data.returned && (
        <p className="text-center text-xs text-muted-foreground">
          Showing first {data.returned.toLocaleString()} of {data.totalMatches.toLocaleString()} matches. Refine the search to narrow the list.
        </p>
      )}
    </div>
  );
}
