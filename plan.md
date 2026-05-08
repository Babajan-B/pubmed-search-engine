# Q Article & Journal Finder Product Plan

## Goal

Turn Q Article & Journal Finder from a PubMed search interface into a practical literature review workspace for academic researchers who need to:

1. build a defensible search strategy
2. find relevant papers quickly
3. screen and organize records
4. extract evidence for writing
5. export citations and evidence tables into the manuscript workflow

## Current Product Strengths

- Fast PubMed search with a simple UI
- Journal-level enrichment through JIF and quartile data
- Useful filters for article type, access, years back, and author country
- Separate journal-oriented view for quick source scanning

## Main Gaps

- Search is still mostly free-text and not reproducible enough for serious review methods
- Results can be viewed, but not screened, tagged, or saved into a project workflow
- Ranking is too journal-centric and not evidence-centric
- Metadata is too thin for evidence extraction and manuscript writing
- There is no export pipeline for citations, evidence tables, or review notes
- There is no persistence layer for saved searches, included papers, or project notes

## Product Vision

The ideal user journey should look like this:

1. Define the research question and search strategy
2. Run and refine the search
3. Screen titles and abstracts
4. Mark studies for inclusion or exclusion
5. Extract structured evidence from included papers
6. Organize papers by theme, method, and quality
7. Export citations and evidence tables for manuscript drafting

## Roadmap

## Phase 1: Search Strategy Builder

### Objective

Make searches reproducible, transparent, and easier to refine.

### Features

- PICO-style query builder
- Boolean query preview
- MeSH term suggestions
- Synonym buckets for search concepts
- Search history with timestamps
- Saved searches per project
- Option to rerun a previous search and detect new records

### Why This Matters

Researchers need to defend how they searched the literature. This is especially important for reviews, theses, and methods sections.

## Phase 2: Screening Workspace

### Objective

Convert results into a real review workflow.

### Features

- Include, exclude, maybe, and key-paper states
- Exclusion reasons
- Notes and tags per article
- Bulk actions for screening
- Filters for unscreened, included, excluded, and tagged records
- Duplicate detection across repeated searches
- Project-level saved article sets

### Why This Matters

The main bottleneck in literature reviews is not finding articles. It is deciding which ones actually belong in the paper.

## Phase 3: Evidence-Centered Ranking

### Objective

Rank and filter papers in ways that are useful for writing and synthesis, not just prestige sorting.

### Features

- Sort by study design strength
- Sort by recency
- Sort by human studies only
- Sort by review type and evidence level
- Topic relevance scoring based on title and abstract
- Better publication type handling from PubMed metadata
- Keep JIF and quartile as secondary context, not the main ranking logic

### Why This Matters

High-JIF journals are not a substitute for relevant evidence. Researchers usually need the best evidence for the exact question.

## Phase 4: Evidence Extraction

### Objective

Support note-taking and structured synthesis for manuscript writing.

### Features

- DOI, PMCID, and full author metadata
- MeSH terms and full publication type list
- Structured extraction fields:
  - population
  - intervention or exposure
  - comparator
  - outcomes
  - sample size
  - setting
  - country
- Free-text notes for main findings and limitations
- Evidence table view across included studies

### Why This Matters

Researchers eventually need a comparison table, not just a stack of article cards.

## Phase 5: Thematic Synthesis

### Objective

Help users see patterns across papers.

### Features

- Grouping by MeSH terms
- Theme clustering from abstracts
- Grouping by study design
- Grouping by country or institution
- Grouping by journal and discipline
- Key-paper detection based on repeated relevance signals
- Related-paper discovery and citation chasing

### Why This Matters

Writing a review requires identifying themes, gaps, disagreements, and methodological trends.

## Phase 6: Export and Writing Support

### Objective

Move from search results to manuscript-ready outputs.

### Features

- BibTeX export
- RIS export
- CSV export
- Evidence matrix export
- Project summary export
- Included-study table export
- Notes export for drafting the introduction, discussion, or review section

### Why This Matters

If the researcher cannot move the data into Zotero, EndNote, Excel, or the manuscript draft, the workflow still breaks.

## Phase 7: Projects and Persistence

### Objective

Make the tool useful across days or weeks of literature work.

### Features

- Project creation
- Saved search strategies
- Saved screened sets
- Saved notes and tags
- Search rerun alerts for newly indexed papers
- Optional collaboration support later

### Why This Matters

Academic writing is iterative. Researchers return to the same topic repeatedly.

## Recommended Priority

If only three upgrades are built first, they should be:

1. Search Strategy Builder
2. Screening Workspace
3. Exportable Evidence Tables

These three changes would move the product from a useful search tool to a real literature review assistant.

## Suggested Build Order

### Step 1

Add project persistence and saved searches.

### Step 2

Add article screening states, notes, and tags.

### Step 3

Expand the PubMed metadata model and extraction pipeline.

### Step 4

Add evidence-table and citation exports.

### Step 5

Improve thematic grouping and ranking logic.

## Success Criteria

The product is succeeding when a researcher can:

- define and save a repeatable search strategy
- screen a large result set without losing decisions
- identify the most relevant and strongest studies quickly
- build an evidence table directly inside the app
- export citations and structured findings into the writing workflow

## Summary

The next version of Q Article & Journal Finder should optimize for the full academic workflow:

search -> screen -> extract -> synthesize -> write

That is the shift that would make it materially more valuable for researchers writing papers, reviews, and theses.
