'use client';

import { useState, useMemo } from 'react';
import type { Article } from '@/app/api/search/route';

// ─── Stop words for keyword extraction ────────────────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','can',
  'not','no','nor','so','yet','both','either','neither','each','more','most',
  'other','some','such','than','too','very','just','as','if','its','this',
  'that','these','those','it','he','she','they','we','you','who','which',
  'what','where','when','how','why','all','any','study','studies','analysis',
  'review','based','using','associated','patients','patient','results','effects',
  'effect','role','impact','risk','factors','factor','new','among','between',
  'clinical','compared','comparison','randomized','systematic','meta','versus',
  'vs','after','before','during','following','via','without','type','high',
  'low','large','small','single','multiple','case','report','evidence','data',
  'outcome','outcomes','related','including','increased','decreased','shows',
  'across','within','their','our','acute','chronic','primary','secondary',
  'potential','possible','current','recent',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalInfo {
  name: string;
  jif: number | null;
  quartile: string | null;
  category: string | null;
  articleCount: number;
}

interface TopicGroup {
  keyword: string;
  journals: JournalInfo[];
  pubmedUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractKeywords(articles: Article[], topN = 8): string[] {
  const freq: Record<string, number> = {};
  for (const a of articles) {
    const words = a.title
      .toLowerCase()
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const seen = new Set<string>();
    for (const w of words) {
      if (!seen.has(w)) {
        freq[w] = (freq[w] ?? 0) + 1;
        seen.add(w);
      }
    }
  }
  return Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function buildJournalList(articles: Article[]): JournalInfo[] {
  const map = new Map<string, JournalInfo>();
  for (const a of articles) {
    const existing = map.get(a.journal);
    if (existing) {
      existing.articleCount++;
    } else {
      map.set(a.journal, {
        name: a.journal,
        jif: a.jif,
        quartile: a.quartile,
        category: a.category,
        articleCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.jif ?? -1) - (a.jif ?? -1));
}

// ─── Quartile badge colours ───────────────────────────────────────────────────

const Q_STYLE: Record<string, string> = {
  Q1: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Q2: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Q3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Q4: 'bg-red-500/15 text-red-400 border-red-500/30',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function JournalTable({ journals }: { journals: JournalInfo[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-8">#</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Journal</th>
            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">Q</th>
            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-20">JIF</th>
            <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-20">Articles</th>
          </tr>
        </thead>
        <tbody>
          {journals.map((j, i) => (
            <tr
              key={j.name}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors"
            >
              <td className="px-4 py-2.5 text-muted-foreground/40 tabular-nums">{i + 1}</td>
              <td className="px-4 py-2.5">
                <span className="font-medium text-foreground/90 leading-snug">{j.name}</span>
                {j.category && (
                  <span className="ml-2 text-[10px] text-muted-foreground/40">{j.category}</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {j.quartile ? (
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${Q_STYLE[j.quartile] ?? ''}`}
                  >
                    {j.quartile}
                  </span>
                ) : (
                  <span className="text-muted-foreground/30">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center tabular-nums">
                {j.jif !== null ? (
                  <span className="text-violet-400 font-semibold">{j.jif.toFixed(1)}</span>
                ) : (
                  <span className="text-muted-foreground/30">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-medium text-foreground/60">
                  {j.articleCount}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopicSection({ group }: { group: TopicGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* expand toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left group"
          aria-expanded={open}
        >
          <svg
            className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-hover:text-foreground ${open ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-foreground capitalize tracking-wide">{group.keyword}</span>
          <span className="text-xs text-muted-foreground/50">
            {group.journals.length} journal{group.journals.length !== 1 ? 's' : ''}
          </span>
        </button>

        {/* PubMed link */}
        <a
          href={group.pubmedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition border border-indigo-500/30 bg-indigo-500/10 rounded-lg px-2.5 py-1 hover:bg-indigo-500/20 whitespace-nowrap"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          PubMed
        </a>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <JournalTable journals={group.journals} />
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  articles: Article[] | null;
  loading: boolean;
  totalFound: number;
  fetched: number;
  filtered: number;
  error: string | null;
  searchQuery: string;
}

export default function JournalResultsPanel({
  articles,
  loading,
  totalFound,
  fetched,
  filtered,
  error,
  searchQuery,
}: Props) {
  const { allJournals, topicGroups } = useMemo(() => {
    if (!articles || articles.length === 0) return { allJournals: [], topicGroups: [] };

    const allJournals = buildJournalList(articles);
    const keywords = extractKeywords(articles);

    const topicGroups: TopicGroup[] = keywords
      .map((kw) => {
        const matching = articles.filter((a) =>
          a.title.toLowerCase().includes(kw),
        );
        const journals = buildJournalList(matching);
        const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(searchQuery + ' ' + kw)}`;
        return { keyword: kw, journals, pubmedUrl };
      })
      .filter((g) => g.journals.length > 0);

    return { allJournals, topicGroups };
  }, [articles, searchQuery]);

  // ── Loading ──
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

  // ── Error ──
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-destructive text-sm">
        {error}
      </div>
    );
  }

  // ── Empty state ──
  if (articles === null) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground text-sm space-y-2">
        <svg className="h-10 w-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p>Enter a query and click <span className="text-primary">Search PubMed</span> to view journals.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm space-y-1">
        <p className="font-medium text-foreground">No journals found.</p>
        <p>Try broadening your query, increasing Years Back, or enabling &quot;All journals&quot;.</p>
      </div>
    );
  }

  // ── Results ──
  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pb-2 border-b border-border">
        <span>PubMed total: <strong className="text-foreground">{totalFound.toLocaleString()}</strong></span>
        <span>Articles fetched: <strong className="text-foreground">{fetched}</strong></span>
        <span>Journals found: <strong className="text-primary">{allJournals.length}</strong></span>
      </div>

      {/* ── All journals ranked table ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All Journals</h2>
          <span className="text-xs text-muted-foreground">ranked by JIF</span>
          <span className="ml-auto text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-medium">
            {allJournals.length} journal{allJournals.length !== 1 ? 's' : ''}
          </span>
        </div>
        <JournalTable journals={allJournals} />
      </section>

      {/* ── By Topic ── */}
      {topicGroups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-t border-border pt-5">
            <h2 className="text-sm font-semibold text-foreground">By Topic</h2>
            <span className="text-xs text-muted-foreground">
              keyword groups extracted from article titles · click <span className="text-indigo-400">PubMed</span> to view articles
            </span>
          </div>
          <div className="space-y-2">
            {topicGroups.map((group) => (
              <TopicSection key={group.keyword} group={group} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
