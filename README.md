# ScholaraBB — PubMed Search Engine

A Next.js 14 web application that searches PubMed, filters results by Journal Impact Factor and quartile rankings, and provides AI-powered summarization and citation export — across all research disciplines.

## Features

### Search & Filter
- **Cross-discipline search** — medicine, biology, engineering, social sciences, physics, and more
- **12 article types** — RCT, Meta-Analysis, Systematic Review, Cohort Study, Case Report, and more
- **Journal Impact Factor filtering** — Q1/Q2/Q3/Q4 or all journals (7 000+ journals, JIF 2024)
- **Author country filter** — narrow by first-author country
- **Access filter** — All / Open Access / Closed
- **Date range** — 1, 3, 5, 10, or 20 years back
- **Humans only** toggle

### Results Panel
- **Article selection** — checkbox on each card to select specific articles; Select All / Deselect All
- **Client-side sort** — re-sort instantly without re-searching:
  - Relevance (PubMed default)
  - JIF high → low / low → high
  - Quartile Q1 → Q4 / Q4 → Q1
  - Year newest / oldest first
- **Expandable abstracts** — inline abstract preview per card

### Export
Export all results or only selected articles in four formats:

| Format | Output |
|---|---|
| CSV | All metadata columns + formatted citation |
| Excel (.xlsx) | Same as CSV with column widths |
| Word (.docx) | Numbered bibliography document |
| BibTeX (.bib) | For Zotero / Mendeley / LaTeX |

**Citation styles:** Vancouver/NLM · APA 7th · AMA · BibTeX

### AI Summary (`/ai-summary`)
Bring your own [Google Gemini API key](https://aistudio.google.com/apikey) to summarize selected articles:

- **Individual Summaries** — 2–3 paragraph academic summary per article with full citation
- **Literature Review** — all articles synthesised into a structured mini literature review with inline `[N]` citations and a reference list
- **Configurable model** — Gemini 2.5 Flash (default) · Gemini 2.5 Pro · Gemini 2.0 Flash
- Copy to clipboard or download as Word document
- API key stored locally in the browser; never persisted on the server

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS + Radix UI |
| Backend | Next.js API Routes (serverless) |
| Data source | PubMed / NCBI E-utilities API |
| Journal database | Static JSON — ~7 000 journals with JIF + quartile |
| Excel export | SheetJS (xlsx) |
| Word export | docx |
| AI | Google Gemini API (user-supplied key) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local development

```bash
git clone https://github.com/jaannawaz/pubmed-search-engine.git
cd pubmed-search-engine

npm install

# Optional: add NCBI API key for higher rate limits (3 → 10 req/s)
cp .env.local.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (optional)

Set in `.env.local` or the Vercel dashboard:

```env
NCBI_API_KEY=           # Raises NCBI rate limit to 10 req/s
NCBI_TOOL_NAME=pubmed-search-engine
NCBI_CONTACT_EMAIL=your-email@example.com
```

## Deploying to Vercel

Connect the GitHub repo at [vercel.com](https://vercel.com) for automatic deploys, or:

```bash
npm i -g vercel
vercel
```

## Project Structure

```
pubmed-search-engine/
├── app/
│   ├── api/
│   │   ├── search/route.ts         # PubMed search endpoint (eSearch + eSummary + eFetch)
│   │   └── ai-summarize/route.ts   # Gemini API proxy (server-side, user key)
│   ├── ai-summary/page.tsx         # AI Summary page
│   ├── journals/                   # Journal View page
│   ├── layout.tsx
│   ├── page.tsx                    # Main search page
│   └── globals.css
├── components/
│   ├── SearchForm.tsx              # Filter panel
│   ├── ArticleCard.tsx             # Result card with checkbox selection
│   ├── ResultsPanel.tsx            # Results list, sort, export toolbar, AI Summary button
│   └── ui/                         # Radix UI components (select, button, tabs, …)
├── lib/
│   ├── journalData.ts              # Journal lookup (JIF + quartile), cached at init
│   ├── export.ts                   # Citation formatters + CSV/Excel/Word/BibTeX export
│   └── utils.ts
├── data/
│   └── top_journals.json           # ~7 000 journals (JIF 2024)
├── vercel.json                     # 30 s serverless timeout
└── .env.local.example
```

## API Reference

### `GET /api/search`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `query` | string | required | Search terms |
| `articleType` | string | `""` | Filter by publication type |
| `yearsBack` | int | `5` | Date range (max 20) |
| `maxResults` | int | `20` | Result limit (max 150) |
| `showAllJournals` | bool | `false` | Include journals not in JIF database |
| `sortBy` | string | `relevance` | `jif-desc`, `jif-asc`, `quartile-asc`, `quartile-desc` |
| `humansOnly` | bool | `false` | Adds `AND Humans[MeSH]` filter |
| `accessFilter` | string | `all` | `all`, `open`, `closed` |
| `authorCountry` | string | `""` | Filter by author affiliation country |

### `POST /api/ai-summarize`

```json
{
  "apiKey": "AIza...",
  "model": "gemini-2.5-flash",
  "mode": "individual | synthesis",
  "articles": [...],
  "citationFormat": "vancouver | apa | ama",
  "query": "search query"
}
```

Returns `{ "result": "<markdown text>" }`. Maximum 30 articles per request.

## Acknowledgements

- **PubMed / NCBI** for the free research API
- **Journal Impact Factor** data 2024
- **Google Gemini** for AI summarization

---

Built for researchers across every discipline.
