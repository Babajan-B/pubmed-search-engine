import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

interface ArticleInput {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  jif: number | null;
  quartile: string | null;
  pubmedUrl: string;
}

interface RequestBody {
  apiKey: string;
  model: string;
  mode: 'individual' | 'synthesis';
  articles: ArticleInput[];
  citationFormat: 'vancouver' | 'apa' | 'ama';
  query: string;
}

function buildCitation(a: ArticleInput, format: string, idx: number): string {
  if (format === 'apa') return `${a.authors} (${a.year}). ${a.title}. ${a.journal}. ${a.pubmedUrl}`;
  if (format === 'ama') return `${idx + 1}. ${a.authors}. ${a.title}. ${a.journal}. ${a.year}. PMID: ${a.pmid}.`;
  return `${idx + 1}. ${a.authors}. ${a.title}. ${a.journal}. ${a.year}. PMID: ${a.pmid}. Available from: ${a.pubmedUrl}`;
}

function buildPrompt(body: RequestBody): string {
  const { mode, articles, citationFormat, query } = body;

  const articleList = articles.map((a, i) => {
    const abstract = (!a.abstract || a.abstract === 'No abstract available' || a.abstract === 'Abstract temporarily unavailable')
      ? '(Abstract not available)'
      : a.abstract;
    return `[${i + 1}] Title: ${a.title}
Authors: ${a.authors}
Journal: ${a.journal} (${a.year})${a.jif ? ` | JIF: ${a.jif}` : ''}${a.quartile ? ` | ${a.quartile}` : ''}
Abstract: ${abstract}`;
  }).join('\n\n');

  const refList = articles.map((a, i) => buildCitation(a, citationFormat, i)).join('\n');

  if (mode === 'individual') {
    return `You are an expert academic writer. For each research article below, write a clear scholarly summary of 2-3 paragraphs covering: the main research question, key methodology, principal findings, and clinical or research implications. Write in formal academic prose.

CITATION FORMAT: ${citationFormat.toUpperCase()}

ARTICLES:
${articleList}

REFERENCE LIST (use these exactly):
${refList}

For each article output exactly:
### [N]. [Article Title]
[2-3 paragraph summary]
**Citation:** [full citation]
---`;
  }

  return `You are an expert academic writer. Based on the ${articles.length} research articles below on the topic of "${query}", write a comprehensive mini literature review. Cite articles inline using [N] notation.

ARTICLES:
${articleList}

REFERENCES (use these exactly):
${refList}

Output exactly this structure:
## Introduction
[2-3 sentences introducing the topic]

## Key Themes and Findings
[Synthesize findings by theme, cite inline with [N]]

## Comparison and Discussion
[Compare methodologies, note agreements, contradictions, limitations]

## Conclusion
[Summarise evidence and future directions]

## References
${articles.map((a, i) => `[${i + 1}] ${buildCitation(a, citationFormat, i)}`).join('\n')}`;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { apiKey, articles, model } = body;
  const geminiModel = model?.trim() || 'gemini-2.5-flash';

  if (!apiKey?.trim()) return NextResponse.json({ error: 'Gemini API key is required.' }, { status: 400 });
  if (!articles?.length) return NextResponse.json({ error: 'No articles provided.' }, { status: 400 });
  if (articles.length > 30) return NextResponse.json({ error: 'Maximum 30 articles per request.' }, { status: 400 });

  const prompt = buildPrompt(body);
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey.trim()}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return NextResponse.json({ error: 'Could not reach Gemini API. Check your network.' }, { status: 502 });
  }

  const data = await geminiRes.json();

  if (!geminiRes.ok) {
    const msg = data?.error?.message ?? `Gemini API error ${geminiRes.status}`;
    return NextResponse.json({ error: msg }, { status: geminiRes.status });
  }

  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) return NextResponse.json({ error: 'Gemini returned an empty response.' }, { status: 500 });

  return NextResponse.json({ result: text });
}
