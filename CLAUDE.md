# CLAUDE.md — PubMed Search Engine

## Project Overview

**ScholaraBB** (formerly "PubMed Search Engine") is a Next.js 14 web application that searches PubMed and filters results by journal impact factor (JIF) and quartile rankings. It supports cross-disciplinary research filtering with 7000+ journals and 12 article types.

- **Live**: Deployed on Vercel
- **Repository**: https://github.com/jaannawaz/pubmed-search-engine
- **Latest commit**: Migrate to Next.js 14 — ScholaraBB rebranding (commit 94d8908)

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) + React 18 |
| **Styling** | Tailwind CSS + Radix UI |
| **Backend** | Next.js API Routes (serverless) |
| **Data source** | PubMed/NCBI E-utilities API |
| **Journal DB** | Static JSON (~7000 journals with JIF + quartile) |
| **Deployment** | Vercel |

## Key Architecture

### API Integration (3-step PubMed flow)
```
GET /api/search?query=X&articleType=Y&...
  ├─ Step 1: eSearch (get PMIDs)
  ├─ Step 2: eSummary (get metadata: title, authors, journal)
  └─ Step 3: eFetch XML (parse abstracts)
```

**File**: `app/api/search/route.ts`

- Builds search term with filters: article type, humans only, open access, date range
- Returns: `{ articles: Article[], totalFound: number, fetched: number, filtered: number }`
- Journal lookup happens in-memory during mapping to avoid repeated disk reads
- Handles API errors gracefully (502 responses)

### Journal Metadata Lookup
**File**: `lib/journalData.ts`

- Loads `data/top_journals.json` once at module initialization (cached in `_lookup`)
- `getJournalMetadata(journalName)` → returns `{ jif, quartile, category }`
- `isTopJournal(journalName)` → boolean (used for filtering)
- **Important**: Journal names are normalized (lowercase, trimmed, "The" prefix stripped)

### Frontend Architecture
- **`app/page.tsx`** — Main search page layout
- **`components/SearchForm.tsx`** — Filter panel (query, article type, JIF quartile, date range, etc.)
- **`components/ResultsPanel.tsx`** — Results display + status bar
- **`components/ArticleCard.tsx`** — Single result card (expandable abstract, metadata badges)
- **`components/ui/*`** — Radix UI primitive wrappers (button, input, select, checkbox, slider, etc.)

## Search Parameters & Defaults

| Param | Type | Default | Max |
|---|---|---|---|
| `query` | string | (required) | — |
| `articleType` | string | "" (all) | 12 types |
| `yearsBack` | int | 5 | 20 |
| `maxResults` | int | 20 | 50 |
| `showAllJournals` | bool | false | — |
| `sortBy` | enum | "relevance" | jif-asc, jif-desc, quartile-asc, quartile-desc |
| `humansOnly` | bool | false | — |
| `openAccess` | bool | false | — |

## Journal Quartile Data Format

**File**: `data/top_journals.json` (or `.private_data/top_journals.json`)

```json
[
  {
    "name": "Nature",
    "aliases": ["Nature Publishing Group"],
    "category": "Multidisciplinary",
    "quartile": "Q1",
    "jif": 64.8
  },
  ...
]
```

- Loaded once per serverless function cold-start
- Normalized names key the lookup map
- Missing JIF/quartile → `null` (article still included if `showAllJournals=true`)

## Development Commands

```bash
# Install deps
npm install

# Local dev server (http://localhost:3000)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Lint code
npm run lint

# Optional: set NCBI API key for higher rate limits
cp .env.local.example .env.local
# Then add: NCBI_API_KEY=your_key
```

## Environment Variables (optional)

Set in `.env.local` or Vercel dashboard:

```env
NCBI_API_KEY=           # Raises rate limit to 10 req/s (vs 3 req/s)
NCBI_TOOL_NAME=pubmed-search-engine
NCBI_CONTACT_EMAIL=your-email@example.com
```

## Common Workflows

### Adding a new article type
1. Add entry to `typeMapping` in `app/api/search/route.ts:28`
2. Update filter options in frontend (`SearchForm.tsx`)

### Updating journal data
1. Replace `data/top_journals.json` with new file
2. Run `npm run dev` to verify loading (check `journalData.ts` error logs)
3. The lookup is cached at module init, so restart dev server if testing changes

### Adding a new filter/sort option
1. Add query parameter to `GET /api/search`
2. Implement filter/sort logic in `route.ts`
3. Add UI control to `SearchForm.tsx`
4. Update fetch call in `page.tsx`

### Styling & UI
- All custom UI components in `components/ui/` use Radix UI + Tailwind
- Global styles in `app/globals.css`
- Tailwind config in `tailwind.config.ts`
- Component config in `components.json`

## Important Notes

### PubMed API Quirks
- **Rate limits**: 3 req/s without API key, 10 req/s with key
- **Abstract fallback**: If eFetch fails, articles show "Abstract temporarily unavailable" (partial success)
- **Journal name normalization**: "The Lancet" matches "lancet" (prefix stripped)
- **Date format**: YYYY/MM/DD for min/maxdate params

### Serverless Timeout
- Vercel timeout set to 30s in `vercel.json`
- PubMed API calls have 15-20s individual timeouts
- If searches timeout, consider reducing `maxResults` or `yearsBack`

### State Management
- No Redux/Context API — simple client-side useState in React components
- Search state passed via URL params (GET /api/search?...)
- Results cached implicitly by browser fetch

### Older Python/Gradio Version
- Legacy Python app in `.old_python_app/` (do not use)
- This is a Next.js rewrite

## File Structure

```
pubmed-search-engine/
├── app/
│   ├── api/
│   │   └── search/route.ts          # Main PubMed search endpoint
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page (search UI)
│   └── globals.css
├── components/
│   ├── SearchForm.tsx               # Filter panel
│   ├── ResultsPanel.tsx             # Results + status
│   ├── ArticleCard.tsx              # Result card
│   └── ui/                          # Radix UI primitives
├── lib/
│   ├── journalData.ts               # Journal lookup (jif + quartile)
│   └── utils.ts
├── data/
│   └── top_journals.json            # ~7000 journals (JIF 2024)
├── public/                          # Static assets
├── .env.local.example               # Example env vars
├── vercel.json                      # Vercel config (30s timeout)
├── tailwind.config.ts
├── tsconfig.json
├── components.json                  # shadcn/ui config
├── next.config.mjs
└── package.json
```

## Debugging Tips

1. **Journal not matching?**
   - Check normalization: lowercase, trimmed, "the " prefix stripped
   - Verify journal name in `data/top_journals.json`
   - Check console logs: `[search] journal match sample` in API response

2. **No results?**
   - Verify NCBI API is responding (check network tab)
   - Check eSearch count in response
   - Try `showAllJournals=true` to see all results, not just top journals

3. **Abstracts missing?**
   - eFetch is best-effort (doesn't fail search if abstract fetch fails)
   - Old articles may not have abstracts in NCBI
   - Check PubMed UI directly for comparison

4. **Deploy issues?**
   - Ensure `data/top_journals.json` is committed (required for Vercel build)
   - Check Vercel build logs for journal load errors
   - Verify env vars set in Vercel dashboard

## Known Limitations

- **No pagination**: Returns up to 50 results (PubMed default)
- **No full-text search**: Uses PubMed abstract/title only
- **Stateless**: No user accounts or saved searches
- **Rate limits**: 3 req/s per IP without NCBI API key
- **JIF data**: Static (updated manually, not real-time)

## Next Steps / TODOs

- [ ] Add pagination / load more results
- [ ] Cache results client-side (IndexedDB?)
- [ ] User favorites / save searches (needs DB)
- [ ] Advanced search syntax builder
- [ ] Export results (CSV, BibTeX)
