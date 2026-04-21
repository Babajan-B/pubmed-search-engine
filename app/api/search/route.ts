import { NextRequest, NextResponse } from 'next/server';
import { getJournalMetadata, isTopJournal } from '@/lib/journalData';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

export interface Article {
  pmid: string;
  title: string;
  journal: string;
  year: string;
  type: string;
  authors: string;
  pubmedUrl: string;
  abstract: string;
  jif: number | null;
  quartile: string | null;
  category: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildSearchTerm(
  query: string,
  articleType: string,
  humansOnly: boolean,
  accessFilter: 'all' | 'open' | 'closed',
): string {
  const typeMapping: Record<string, string> = {
    'Randomized Controlled Trial': 'Randomized Controlled Trial[Publication Type]',
    'Meta-Analysis': 'Meta-Analysis[Publication Type]',
    'Systematic Review': 'Systematic Review[Publication Type]',
    'Clinical Trial': 'Clinical Trial[Publication Type]',
    'Review': 'Review[Publication Type]',
    'Research Article': 'Journal Article[Publication Type]',
    'Case Report': 'Case Reports[Publication Type]',
    'Observational Study': 'Observational Study[Publication Type]',
    'Cohort Study': 'Cohort Studies[MeSH Terms]',
    'Editorial': 'Editorial[Publication Type]',
    'Letter': 'Letter[Publication Type]',
  };

  let term = query;
  if (articleType && typeMapping[articleType]) {
    term += ` AND ${typeMapping[articleType]}`;
  }
  if (humansOnly) {
    term += ' AND humans[MeSH Terms]';
  }
  if (accessFilter === 'open') {
    term += ' AND free full text[sb]';
  } else if (accessFilter === 'closed') {
    term += ' NOT free full text[sb]';
  }
  return term;
}

function parseAbstracts(xmlContent: string): Record<string, string> {
  const abstracts: Record<string, string> = {};
  const articlePattern = /<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g;
  let articleMatch: RegExpExecArray | null;

  while ((articleMatch = articlePattern.exec(xmlContent)) !== null) {
    const articleXml = articleMatch[0];
    const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];

    const texts: string[] = [];
    const abstractPattern =
      /<AbstractText(?:[^>]* Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let aMatch: RegExpExecArray | null;
    while ((aMatch = abstractPattern.exec(articleXml)) !== null) {
      const label = aMatch[1];
      const text = aMatch[2].replace(/<[^>]+>/g, '').trim();
      if (text) texts.push(label ? `${label}: ${text}` : text);
    }
    if (texts.length > 0) abstracts[pmid] = texts.join('\n\n');
  }
  return abstracts;
}

function extractYear(pubdate: string): string {
  const match = pubdate?.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : 'Unknown';
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function sortArticles(articles: Article[], sortBy: string): Article[] {
  const clone = [...articles];
  if (sortBy === 'jif-desc') {
    return clone.sort((a, b) => (b.jif ?? 0) - (a.jif ?? 0));
  }
  if (sortBy === 'jif-asc') {
    return clone.sort((a, b) => (a.jif ?? 0) - (b.jif ?? 0));
  }
  if (sortBy === 'quartile-asc') {
    const order: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    return clone.sort(
      (a, b) => (order[a.quartile ?? ''] ?? 9) - (order[b.quartile ?? ''] ?? 9),
    );
  }
  if (sortBy === 'quartile-desc') {
    const order: Record<string, number> = { Q4: 1, Q3: 2, Q2: 3, Q1: 4 };
    return clone.sort(
      (a, b) => (order[a.quartile ?? ''] ?? 9) - (order[b.quartile ?? ''] ?? 9),
    );
  }
  return clone; // relevance — keep PubMed order
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query')?.trim() ?? '';
  const articleType = searchParams.get('articleType') ?? '';
  const humansOnly = searchParams.get('humansOnly') === 'true';
  const accessFilterRaw = searchParams.get('accessFilter') ?? 'all';
  const accessFilter = (['all', 'open', 'closed'].includes(accessFilterRaw)
    ? accessFilterRaw
    : 'all') as 'all' | 'open' | 'closed';
  const yearsBack = Math.min(parseInt(searchParams.get('yearsBack') ?? '5', 10), 20);
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') ?? '20', 10), 150);
  const showAllJournals = searchParams.get('showAllJournals') === 'true';
  const sortBy = searchParams.get('sortBy') ?? 'relevance';

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  // Build NCBI params
  const apiKey = process.env.NCBI_API_KEY ?? '';
  const toolName = process.env.NCBI_TOOL_NAME ?? 'pubmed-search-engine';
  const email = process.env.NCBI_CONTACT_EMAIL ?? 'contact@example.com';

  const base = new URLSearchParams({ tool: toolName, email });
  if (apiKey) base.set('api_key', apiKey);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - yearsBack);

  const searchTerm = buildSearchTerm(query, articleType, humansOnly, accessFilter);

  // ── Step 1: eSearch ────────────────────────────────────────────────────
  const searchUrl =
    `${PUBMED_BASE}esearch.fcgi?` +
    base.toString() +
    `&db=pubmed` +
    `&term=${encodeURIComponent(searchTerm)}` +
    `&retmode=json` +
    `&retmax=${maxResults}` +
    `&sort=pub+date` +
    `&mindate=${formatDate(startDate)}` +
    `&maxdate=${formatDate(endDate)}`;

  let searchData: Record<string, unknown>;
  try {
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`eSearch HTTP ${res.status}`);
    searchData = await res.json();
  } catch (err) {
    console.error('eSearch error:', err);
    return NextResponse.json({ error: 'Could not connect to PubMed. Please try again.' }, { status: 502 });
  }

  const esearchResult = searchData.esearchresult as Record<string, unknown> | undefined;
  const pmids: string[] = (esearchResult?.idlist as string[]) ?? [];
  const totalFound = parseInt((esearchResult?.count as string) ?? '0', 10);

  if (pmids.length === 0) {
    return NextResponse.json({ articles: [], totalFound: 0, fetched: 0, filtered: 0 });
  }

  // ── Step 2: eSummary ───────────────────────────────────────────────────
  const summaryUrl =
    `${PUBMED_BASE}esummary.fcgi?` +
    base.toString() +
    `&db=pubmed` +
    `&id=${pmids.join(',')}` +
    `&retmode=json`;

  let summaryData: Record<string, unknown>;
  try {
    const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`eSummary HTTP ${res.status}`);
    summaryData = await res.json();
  } catch (err) {
    console.error('eSummary error:', err);
    return NextResponse.json({ error: 'Failed to fetch article summaries.' }, { status: 502 });
  }

  const resultObj = summaryData.result as Record<string, Record<string, unknown>> | undefined;

  const articles: Article[] = pmids
    .map((pmid) => {
      const d = resultObj?.[pmid];
      if (!d) return null;

      const journal =
        (d.fulljournalname as string) || (d.source as string) || 'Unknown Journal';
      const meta = getJournalMetadata(journal);

      const authorList = (d.authors as Array<{ name: string }> | undefined) ?? [];
      const authors =
        authorList.length > 0
          ? authorList
              .slice(0, 3)
              .map((a) => a.name)
              .join(', ') + (authorList.length > 3 ? ' et al.' : '')
          : 'Unknown authors';

      const pubTypes = d.pubtype as string[] | undefined;

      return {
        pmid,
        title: (d.title as string) || 'No title',
        journal,
        year: extractYear((d.pubdate as string) || ''),
        type: pubTypes?.[0] ?? 'Journal Article',
        authors,
        pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        abstract: '',
        jif: meta.jif,
        quartile: meta.quartile,
        category: meta.category,
      } satisfies Article;
    })
    .filter((a): a is Article => a !== null);

  // ── Step 3: eFetch abstracts ───────────────────────────────────────────
  const fetchUrl =
    `${PUBMED_BASE}efetch.fcgi?` +
    base.toString() +
    `&db=pubmed` +
    `&id=${pmids.join(',')}` +
    `&retmode=xml`;

  try {
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(20_000) });
    if (res.ok) {
      const xml = await res.text();
      const abstracts = parseAbstracts(xml);
      for (const article of articles) {
        article.abstract = abstracts[article.pmid] ?? 'No abstract available';
      }
    }
  } catch (err) {
    console.error('eFetch error:', err);
    for (const article of articles) {
      article.abstract = 'Abstract temporarily unavailable';
    }
  }

  // ── Filter + sort ──────────────────────────────────────────────────────
  if (!showAllJournals) {
    const sample = articles.slice(0, 3).map((a) => ({
      journal: a.journal,
      matched: isTopJournal(a.journal),
    }));
    console.log('[search] journal match sample:', JSON.stringify(sample));
  }

  const filtered = showAllJournals
    ? articles
    : articles.filter((a) => isTopJournal(a.journal));

  const sorted = sortArticles(filtered, sortBy);

  return NextResponse.json({
    articles: sorted,
    totalFound,
    fetched: articles.length,
    filtered: sorted.length,
  });
}
