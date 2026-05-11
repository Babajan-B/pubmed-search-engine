import { Article } from '@/app/api/search/route';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';

export type CitationFormat = 'vancouver' | 'apa' | 'ama' | 'bibtex';

const formatCitation = (article: Article, format: CitationFormat, index?: number): string => {
  switch (format) {
    case 'vancouver':
      return formatVancouver(article, index || 0);
    case 'apa':
      return formatAPA(article);
    case 'ama':
      return formatAMA(article, index || 0);
    case 'bibtex':
      return formatBibTeX(article);
    default:
      return '';
  }
};

export const formatVancouver = (article: Article, index: number): string => {
  const authors = article.authors || 'Unknown';
  const title = article.title || 'Untitled';
  const year = article.year || 'Unknown Year';
  const pmid = article.pmid;
  return `${index + 1}. ${authors}. ${title}. ${article.journal}. ${year}. PMID: ${pmid}. Available from: ${article.pubmedUrl}`;
};

export const formatAPA = (article: Article): string => {
  const authors = article.authors || 'Unknown';
  const year = article.year || 'n.d.';
  const title = article.title || 'Untitled';
  const journal = article.journal || 'Unknown Journal';
  return `${authors} (${year}). ${title}. ${journal}. Retrieved from ${article.pubmedUrl}`;
};

export const formatAMA = (article: Article, index: number): string => {
  const authors = article.authors || 'Unknown';
  const title = article.title || 'Untitled';
  const journal = article.journal || 'Unknown Journal';
  const year = article.year || 'Unknown Year';
  const pmid = article.pmid;
  return `${index + 1}. ${authors}. ${title}. ${journal}. ${year}. PMID: ${pmid}. https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
};

export const formatBibTeX = (article: Article): string => {
  const key = `pmid${article.pmid}`;
  const authors = article.authors?.replace(' et al.', '') || 'Unknown';
  const title = (article.title || 'Untitled').replace(/"/g, '\\"');
  const journal = article.journal || 'Unknown Journal';
  const year = article.year || 'Unknown Year';
  const pmid = article.pmid;
  return `@article{${key},
  title = "${title}",
  author = "${authors}",
  journal = "${journal}",
  year = "${year}",
  pmid = "${pmid}",
  url = "https://pubmed.ncbi.nlm.nih.gov/${pmid}/"
}`;
};

export const exportCSV = (articles: Article[], citationFormat: CitationFormat, query: string): void => {
  if (articles.length === 0) return;

  const headers = ['#', 'Title', 'Authors', 'Journal', 'Year', 'Type', 'JIF', 'Quartile', 'Category', 'Countries', 'PubMed URL', 'Citation'];

  const rows = articles.map((article, idx) => [
    (idx + 1).toString(),
    article.title || '',
    article.authors || '',
    article.journal || '',
    article.year || '',
    article.type || '',
    article.jif?.toString() || '',
    article.quartile || '',
    article.category || '',
    article.authorCountries?.join('; ') || '',
    article.pubmedUrl || '',
    formatCitation(article, citationFormat, idx),
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `scholarabb-results-${query.replace(/\s+/g, '-').slice(0, 30)}.csv`;
  link.click();
};

export const exportExcel = async (articles: Article[], citationFormat: CitationFormat, query: string): Promise<void> => {
  if (articles.length === 0) return;

  const XLSX = await import('xlsx');

  const data = articles.map((article, idx) => ({
    '#': idx + 1,
    Title: article.title || '',
    Authors: article.authors || '',
    Journal: article.journal || '',
    Year: article.year || '',
    Type: article.type || '',
    JIF: article.jif || '',
    Quartile: article.quartile || '',
    Category: article.category || '',
    Countries: article.authorCountries?.join('; ') || '',
    'PubMed URL': article.pubmedUrl || '',
    Citation: formatCitation(article, citationFormat, idx),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 3 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 6 },
    { wch: 15 }, { wch: 6 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
    { wch: 25 }, { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
  XLSX.writeFile(workbook, `scholarabb-results-${query.replace(/\s+/g, '-').slice(0, 30)}.xlsx`);
};

export const exportWord = async (articles: Article[], citationFormat: CitationFormat, query: string): Promise<void> => {
  if (articles.length === 0) return;

  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: `Bibliography: ${query}`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Total Results: ${articles.length}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: new Date().toLocaleDateString(),
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: '' }),
  ];

  articles.forEach((article, idx) => {
    const citation = formatCitation(article, citationFormat, idx);
    paragraphs.push(new Paragraph({ text: citation, spacing: { after: 200 } }));
  });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `scholarabb-results-${query.replace(/\s+/g, '-').slice(0, 30)}.docx`;
  link.click();
};

export const exportBibTeX = (articles: Article[], query: string): void => {
  if (articles.length === 0) return;

  const bibtexEntries = articles.map(article => formatBibTeX(article)).join('\n\n');
  const content = `% BibTeX bibliography
% Generated from ScholaraBB search: "${query}"
% Date: ${new Date().toISOString()}
% Total entries: ${articles.length}

${bibtexEntries}`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `scholarabb-results-${query.replace(/\s+/g, '-').slice(0, 30)}.bib`;
  link.click();
};
