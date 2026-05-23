import scopusJournals from '@/data/scopus_journals_mar_2026.json';

export interface ScopusJournalEntry {
  sourceRecordId: string | null;
  title: string;
  rank?: number | null;
  issn: string | null;
  eissn: string | null;
  status: string | null;
  coverage: string | null;
  discontinuedByScopus: string | null;
  language: string | null;
  medline: string | null;
  openAccess: string | null;
  articlesInPress: string | null;
  addedMarch2026: string | null;
  sourceType: string | null;
  titleHistory: string | null;
  relatedTitles: string[];
  publisher: string | null;
  publisherGroup: string | null;
  asjcCodes: string[];
  topLevelSubjects: string[];
  subjects: string[];
}

export interface ScopusJournalFilters {
  query?: string;
  status?: string;
  sourceType?: string;
  subject?: string;
  sortBy?: string;
  limit?: number;
}

const JOURNALS = scopusJournals as ScopusJournalEntry[];

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getSearchText(journal: ScopusJournalEntry): string {
  return normalize([
    journal.title,
    journal.issn,
    journal.eissn,
    journal.publisher,
    journal.publisherGroup,
    journal.asjcCodes.join(' '),
    journal.topLevelSubjects.join(' '),
    journal.subjects.join(' '),
  ].filter(Boolean).join(' '));
}

function matchesQuery(journal: ScopusJournalEntry, query: string): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const searchText = getSearchText(journal);
  return terms.every((term) => searchText.includes(term));
}

function getCoverageEndYear(coverage: string | null): number {
  if (!coverage) return 0;
  const years = coverage.match(/\b\d{4}\b/g);
  if (!years) return 0;
  return Math.max(...years.map(Number));
}

function compareText(a: string | null | undefined, b: string | null | undefined): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}

function sortScopusJournals(journals: ScopusJournalEntry[], sortBy: string): ScopusJournalEntry[] {
  const sorted = [...journals];

  switch (sortBy) {
    case 'title-desc':
      return sorted.sort((a, b) => compareText(b.title, a.title));
    case 'coverage-desc':
      return sorted.sort((a, b) => getCoverageEndYear(b.coverage) - getCoverageEndYear(a.coverage) || compareText(a.title, b.title));
    case 'coverage-asc':
      return sorted.sort((a, b) => getCoverageEndYear(a.coverage) - getCoverageEndYear(b.coverage) || compareText(a.title, b.title));
    case 'status':
      return sorted.sort((a, b) => compareText(a.status, b.status) || compareText(a.title, b.title));
    case 'publisher':
      return sorted.sort((a, b) => compareText(a.publisherGroup ?? a.publisher, b.publisherGroup ?? b.publisher) || compareText(a.title, b.title));
    case 'rank-asc':
      return sorted.sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) || compareText(a.title, b.title));
    case 'title-asc':
    default:
      return sorted.sort((a, b) => compareText(a.title, b.title));
  }
}

export function getScopusStats() {
  const byStatus = new Map<string, number>();
  const byType = new Map<string, number>();

  for (const journal of JOURNALS) {
    if (journal.status) byStatus.set(journal.status, (byStatus.get(journal.status) ?? 0) + 1);
    if (journal.sourceType) byType.set(journal.sourceType, (byType.get(journal.sourceType) ?? 0) + 1);
  }

  return {
    total: JOURNALS.length,
    active: byStatus.get('Active') ?? 0,
    inactive: byStatus.get('Inactive') ?? 0,
    statuses: Array.from(byStatus.entries()).map(([value, count]) => ({ value, count })),
    sourceTypes: Array.from(byType.entries()).map(([value, count]) => ({ value, count })),
  };
}

export function searchScopusJournals({
  query = '',
  status = 'all',
  sourceType = 'all',
  subject = 'all',
  sortBy = 'title-asc',
  limit = 100,
}: ScopusJournalFilters) {
  const normalizedStatus = normalize(status);
  const normalizedType = normalize(sourceType);
  const normalizedSubject = normalize(subject);
  const max = Math.min(Math.max(limit, 1), 500);
  const matches: ScopusJournalEntry[] = [];
  let totalMatches = 0;

  for (const journal of JOURNALS) {
    if (normalizedStatus !== 'all' && normalize(journal.status ?? '') !== normalizedStatus) continue;
    if (normalizedType !== 'all' && normalize(journal.sourceType ?? '') !== normalizedType) continue;
    if (normalizedSubject !== 'all') {
      const subjects = [...journal.topLevelSubjects, ...journal.subjects].map(normalize);
      if (!subjects.some((entry) => entry === normalizedSubject)) continue;
    }
    if (query && !matchesQuery(journal, query)) continue;

    totalMatches++;
    matches.push(journal);
  }

  const results = sortScopusJournals(matches, sortBy).slice(0, max);

  return {
    journals: results,
    totalMatches,
    returned: results.length,
    stats: getScopusStats(),
  };
}

export function getScopusSubjects() {
  const subjects = new Set<string>();
  for (const journal of JOURNALS) {
    for (const subject of [...journal.topLevelSubjects, ...journal.subjects]) {
      if (subject) subjects.add(subject.trim());
    }
  }
  return Array.from(subjects).sort((a, b) => a.localeCompare(b));
}
