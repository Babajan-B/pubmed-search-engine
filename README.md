# 🔬 PubMed Search Engine

A Next.js web application that searches PubMed and filters results to show only articles from high-impact journals — across **all research disciplines**. Deployed on Vercel.

## ✨ Features

- **Cross-discipline search** — medicine, biology, engineering, social sciences, physics, and more
- **Journal Impact Factor filtering** — show only Q1/Q2/Q3/Q4 journals or all journals
- **12 article types** — RCT, Meta-Analysis, Systematic Review, Cohort Study, Case Report, etc.
- **Smart sorting** — by JIF, quartile, or PubMed relevance
- **Abstract preview** — expandable inline abstracts
- **Open Access filter** — show only freely accessible articles
- **Mobile responsive** — works on all devices

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Data source | PubMed / NCBI E-utilities API |
| Journal data | JIF 2024 (~7 000+ journals) |
| Deployment | Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn

### Local development

```bash
git clone https://github.com/jaannawaz/pubmed-search-engine.git
cd pubmed-search-engine

npm install

# Optional: copy env file and add NCBI API key for higher rate limits
cp .env.local.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🌐 Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

vercel
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deploys on push.

### Environment Variables (optional)

Set these in the Vercel dashboard or `.env.local`:

```env
NCBI_API_KEY=           # Optional — raises rate limit to 10 req/s
NCBI_TOOL_NAME=pubmed-search-engine
NCBI_CONTACT_EMAIL=your-email@example.com
```

## 📁 Project Structure

```
pubmed-search-engine/
├── app/
│   ├── api/search/route.ts   # PubMed search API endpoint
│   ├── layout.tsx
│   ├── page.tsx              # Main search page
│   └── globals.css
├── components/
│   ├── SearchForm.tsx        # Filter panel
│   ├── ArticleCard.tsx       # Single result card
│   └── ResultsPanel.tsx      # Results list + status
├── lib/
│   └── journalData.ts        # Journal lookup (JIF + quartile)
├── data/
│   └── top_journals.json     # ~7 000 journals with JIF + quartile
├── vercel.json               # 30s serverless timeout
└── .env.local.example
```

## 📝 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- **PubMed / NCBI** for the free research API
- **Journal Impact Factor** data 2024

---

**Built for researchers across every discipline**