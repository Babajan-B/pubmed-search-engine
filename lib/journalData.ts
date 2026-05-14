import fs from 'fs';
import path from 'path';

export interface JournalEntry {
  name: string;
  aliases?: string[];
  category?: string;
  quartile: string;
  jif: number;
}

export interface JournalMetadata {
  jif: number | null;
  quartile: string | null;
  category: string | null;
  canonicalName: string | null;
}

export interface JournalSearchResult {
  name: string;
  aliases: string[];
  category: string | null;
  quartile: string | null;
  jif: number | null;
}

// Load and cache the journal lookup at module level so it is built once per
// serverless function cold-start rather than on every request.
let _lookup: Map<string, JournalMetadata> | null = null;
let _journals: JournalEntry[] | null = null;

function normalizeName(name: string): string {
  if (!name) return '';
  let n = name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  // PubMed often prefixes names with "the " — strip it for matching
  if (n.startsWith('the ')) n = n.slice(4);
  return n;
}

function loadJournals(): JournalEntry[] {
  if (_journals) return _journals;

  try {
    const filePath = path.join(process.cwd(), 'data', 'top_journals.json');
    let raw = fs.readFileSync(filePath, 'utf-8');
    // The source JSON sometimes contains bare NaN (not valid JSON) — replace with null
    raw = raw.replace(/:\s*NaN\b/g, ': null');
    _journals = JSON.parse(raw) as JournalEntry[];
  } catch (err) {
    console.error('Failed to load journal data:', err);
    _journals = [];
  }

  return _journals;
}

function buildLookup(): Map<string, JournalMetadata> {
  const lookup = new Map<string, JournalMetadata>();
  const journals = loadJournals();

  for (const journal of journals) {
    const meta: JournalMetadata = {
      jif: journal.jif ?? null,
      quartile: journal.quartile ?? null,
      category: journal.category ?? null,
      canonicalName: journal.name,
    };

    const names = [journal.name, ...(journal.aliases ?? [])];
    for (const n of names) {
      const key = normalizeName(n);
      if (key) {
        lookup.set(key, meta);
        // Also index with "the " prefix stripped / added so both forms match
        if (!key.startsWith('the ')) lookup.set('the ' + key, meta);
      }
    }
  }

  return lookup;
}

function getLookup(): Map<string, JournalMetadata> {
  if (!_lookup) _lookup = buildLookup();
  return _lookup;
}

export function getJournalMetadata(journalName: string): JournalMetadata {
  const lookup = getLookup();
  const key = normalizeName(journalName);
  return lookup.get(key) ?? { jif: null, quartile: null, category: null, canonicalName: null };
}

export function isTopJournal(journalName: string): boolean {
  const lookup = getLookup();
  const key = normalizeName(journalName);
  return lookup.has(key);
}

export function searchJournalsByName(query: string, limit = 100): JournalSearchResult[] {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return [];
  type ScoredJournal = { score: number; journal: JournalSearchResult };

  const queryParts = normalizedQuery
    .split(/\s+/)
    .filter((part) => part.length > 1);

  return loadJournals()
    .map((journal): ScoredJournal | null => {
      const names = [journal.name, ...(journal.aliases ?? [])];
      const normalizedNames = names.map(normalizeName);
      const exact = normalizedNames.some((name) => name === normalizedQuery);
      const phrase = normalizedNames.some((name) => name.includes(normalizedQuery));
      const allTerms = queryParts.length > 1 && normalizedNames.some((name) =>
        queryParts.every((part) => name.includes(part)),
      );

      if (!exact && !phrase && !allTerms) return null;

      const score = exact ? 3 : phrase ? 2 : 1;
      return {
        score,
        journal: {
          name: journal.name,
          aliases: journal.aliases ?? [],
          category: journal.category ?? null,
          quartile: journal.quartile ?? null,
          jif: journal.jif ?? null,
        } satisfies JournalSearchResult,
      };
    })
    .filter((entry): entry is ScoredJournal => entry !== null)
    .sort((a, b) => b.score - a.score || (b.journal.jif ?? -1) - (a.journal.jif ?? -1))
    .slice(0, limit)
    .map((entry) => entry.journal);
}
