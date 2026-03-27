#!/usr/bin/env python3
"""
PubMed Top Journals Student App

A beginner-friendly Gradio application that searches PubMed and filters results
to show only articles from high-impact journals based on Journal Impact Factor data.

Author: AI Assistant
Version: 1.0
"""

import os
import json
import time
import requests
import pandas as pd
import gradio as gr
from typing import Dict, List, Optional, Tuple
from lxml import etree
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class PubMedSearcher:
    """Handles PubMed API interactions and journal filtering."""
    
    def __init__(self):
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        self.tool_name = os.getenv('NCBI_TOOL_NAME', 'pubmed-topjournals-student-app')
        self.email = os.getenv('NCBI_CONTACT_EMAIL', 'student@example.com')
        self.api_key = os.getenv('NCBI_API_KEY', '')
        
        # Load journal data
        self.journal_data = self._load_journal_data()
        self.journal_lookup = self._build_journal_lookup()
        
        print(f"Loaded {len(self.journal_data)} journals from database")
    
    def _load_journal_data(self) -> List[Dict]:
        """Load journal impact factor data from JSON file."""
        try:
            # Try multiple possible locations
            possible_paths = [
                'journal_impact_factors/top_journals.json',
                '.private_data/top_journals.json',
                'top_journals.json'
            ]
            
            for path in possible_paths:
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        print(f"Loaded journal data from: {path}")
                        return data
                except FileNotFoundError:
                    continue
            
            print("Warning: top_journals.json not found in any expected location")
            return []
        except Exception as e:
            print(f"Error loading journal data: {e}")
            return []
    
    def _build_journal_lookup(self) -> Dict[str, Dict]:
        """Build a normalized lookup dictionary for journal matching."""
        lookup = {}
        
        for journal in self.journal_data:
            # Normalize journal name and aliases
            names_to_add = [journal['name']]
            if journal.get('aliases'):
                names_to_add.extend(journal['aliases'])
            
            for name in names_to_add:
                normalized = self._normalize_journal_name(name)
                if normalized:
                    lookup[normalized] = {
                        'quartile': journal['quartile'],
                        'jif': journal['jif'],
                        'category': journal.get('category', 'Unknown'),
                        'canonical_name': journal['name']
                    }
        
        return lookup
    
    def _normalize_journal_name(self, name: str) -> str:
        """Normalize journal name for matching."""
        if not name:
            return ""
        
        # Convert to lowercase, strip whitespace, collapse spaces, remove trailing periods
        normalized = ' '.join(name.lower().strip().split())
        normalized = normalized.rstrip('.')
        
        return normalized
    
    def _get_api_params(self) -> Dict[str, str]:
        """Get common API parameters."""
        params = {
            'tool': self.tool_name,
            'email': self.email
        }
        if self.api_key:
            params['api_key'] = self.api_key
        return params
    
    def _make_api_request(self, url: str, params: Dict) -> Optional[Dict]:
        """Make API request with error handling and retry logic."""
        try:
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code >= 500:
                # Server error - retry once
                print(f"Server error {response.status_code}, retrying...")
                time.sleep(1)
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
            
            print(f"API request failed with status {response.status_code}")
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"API request error: {e}")
            return None
    
    def _build_search_term(self, query: str, article_type: str, humans_only: bool, open_access: bool) -> str:
        """Build PubMed search term with filters."""
        search_term = query
        
        # Add article type filter
        if article_type:
            type_mapping = {
                "RCT": "Randomized Controlled Trial[Publication Type]",
                "Randomized Controlled Trial": "Randomized Controlled Trial[Publication Type]",
                "Meta-Analysis": "Meta-Analysis[Publication Type]",
                "Systematic Review": "Systematic Review[Publication Type]",
                "Clinical Trial": "Clinical Trial[Publication Type]",
                "Review": "Review[Publication Type]",
                "Research Article": "Journal Article[Publication Type]"
            }
            if article_type in type_mapping:
                search_term += f" AND {type_mapping[article_type]}"
        
        # Add human studies filter
        if humans_only:
            search_term += " AND humans[MeSH Terms]"
        
        # Add open access filter
        if open_access:
            search_term += " AND free full text[sb]"
        
        return search_term
    
    def search_pubmed(self, query: str, article_type: str, humans_only: bool, open_access: bool,
                     years_back: int, max_results: int, show_all_journals: bool) -> Tuple[str, List[Dict]]:
        """Search PubMed and return formatted results."""
        
        if not query.strip():
            return "Please enter a search query.", []
        
        # Cap max results
        max_results = min(max_results, 100)
        
        # Build search term
        search_term = self._build_search_term(query, article_type, humans_only, open_access)
        
        # Calculate date range
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years_back * 365)
        
        print(f"Searching PubMed: {search_term}")
        print(f"Date range: {start_date.strftime('%Y/%m/%d')} to {end_date.strftime('%Y/%m/%d')}")
        
        # Step 1: E-Search to get PMIDs
        search_params = {
            'db': 'pubmed',
            'term': search_term,
            'retmode': 'json',
            'retmax': max_results,
            'sort': 'pub+date',
            'mindate': start_date.strftime('%Y/%m/%d'),
            'maxdate': end_date.strftime('%Y/%m/%d'),
            **self._get_api_params()
        }
        
        search_response = self._make_api_request(
            f"{self.base_url}esearch.fcgi", search_params
        )
        
        if not search_response:
            return "❌ Error: Could not connect to PubMed. Please check your internet connection and try again.", []
        
        # Check for errors in response
        if 'esearchresult' not in search_response:
            return "❌ Error: Invalid response from PubMed. Please try again.", []
        
        esearch_result = search_response['esearchresult']
        
        if 'errorlist' in esearch_result and esearch_result['errorlist']:
            error_msg = esearch_result['errorlist'].get('errormessage', ['Unknown error'])
            return f"❌ PubMed error: {error_msg[0]}", []
        
        pmids = esearch_result.get('idlist', [])
        total_found = int(esearch_result.get('count', 0))
        
        if not pmids:
            return f"🔍 No articles found for '{query}'. Try:\n• Broader search terms\n• Increase 'Years Back' range\n• Turn on 'Show All Journals'", []
        
        print(f"Found {total_found} articles, processing {len(pmids)} PMIDs")
        
        # Step 2: E-Summary to get metadata
        articles = []
        batch_size = 200
        
        for i in range(0, len(pmids), batch_size):
            batch_pmids = pmids[i:i + batch_size]
            
            summary_params = {
                'db': 'pubmed',
                'id': ','.join(batch_pmids),
                'retmode': 'json',
                **self._get_api_params()
            }
            
            summary_response = self._make_api_request(
                f"{self.base_url}esummary.fcgi", summary_params
            )
            
            if summary_response and 'result' in summary_response:
                for pmid in batch_pmids:
                    if pmid in summary_response['result']:
                        article_data = summary_response['result'][pmid]
                        articles.append(self._process_article_metadata(article_data, pmid))
            
            # Be polite to the API
            time.sleep(0.1)
        
        # Step 3: E-Fetch to get abstracts
        articles_with_abstracts = []
        abstract_batch_size = 50
        
        for i in range(0, len(articles), abstract_batch_size):
            batch_articles = articles[i:i + abstract_batch_size]
            batch_pmids = [article['pmid'] for article in batch_articles]
            
            fetch_params = {
                'db': 'pubmed',
                'id': ','.join(batch_pmids),
                'retmode': 'xml',
                **self._get_api_params()
            }
            
            fetch_response = requests.get(
                f"{self.base_url}efetch.fcgi", params=fetch_params, timeout=30
            )
            
            if fetch_response.status_code == 200:
                abstracts = self._parse_abstracts(fetch_response.text)
                
                for article in batch_articles:
                    article['abstract'] = abstracts.get(article['pmid'], 'No abstract available')
                    articles_with_abstracts.append(article)
            else:
                # Add articles without abstracts
                for article in batch_articles:
                    article['abstract'] = 'Abstract temporarily unavailable'
                    articles_with_abstracts.append(article)
            
            # Be polite to the API
            time.sleep(0.1)
        
        # Filter by journals if not showing all
        if not show_all_journals:
            filtered_articles = []
            for article in articles_with_abstracts:
                if self._is_top_journal(article['journal']):
                    filtered_articles.append(article)
        else:
            filtered_articles = articles_with_abstracts
        
        # Build status message
        status_parts = [f"✅ {total_found} found"]
        if len(articles) < total_found:
            status_parts.append(f"→ {len(articles)} after date/filter limits")
        
        if not show_all_journals:
            status_parts.append(f"→ {len(filtered_articles)} kept (Top journals)")
        else:
            status_parts.append(f"→ {len(filtered_articles)} kept (All journals)")

        status_message = " ".join(status_parts)
        
        return status_message, filtered_articles
    
    def _process_article_metadata(self, article_data: Dict, pmid: str) -> Dict:
        """Process article metadata from E-Summary response."""
        # Extract title
        title = article_data.get('title', 'No title available')
        
        # Extract journal
        journal = article_data.get('fulljournalname', article_data.get('source', 'Unknown Journal'))
        
        # Extract publication date
        pubdate = article_data.get('pubdate', '')
        year = self._extract_year(pubdate)
        
        # Extract article type
        article_type = article_data.get('pubtype', ['Unknown'])
        if isinstance(article_type, list) and article_type:
            article_type = article_type[0]
        
        # Check if it's a top journal and get metadata
        journal_metadata = self._get_journal_metadata(journal)
        
        return {
            'pmid': pmid,
            'title': title,
            'journal': journal,
            'year': year,
            'type': article_type,
            'pubmed_url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            'jif': journal_metadata.get('jif', None),
            'quartile': journal_metadata.get('quartile', None),
            'category': journal_metadata.get('category', None)
        }
    
    def _extract_year(self, pubdate: str) -> str:
        """Extract year from publication date string."""
        if not pubdate:
            return "Unknown"
        
        # Try to extract year from various date formats
        import re
        year_match = re.search(r'\b(19|20)\d{2}\b', pubdate)
        if year_match:
            return year_match.group()
        
        return "Unknown"
    
    def _parse_abstracts(self, xml_content: str) -> Dict[str, str]:
        """Parse abstracts from E-Fetch XML response."""
        abstracts = {}
        
        try:
            root = etree.fromstring(xml_content)
            
            for article in root.xpath('//PubmedArticle'):
                pmid = article.find('.//PMID')
                if pmid is not None:
                    pmid_text = pmid.text
                    
                    abstract_parts = []
                    for abstract_text in article.xpath('.//AbstractText'):
                        label = abstract_text.get('Label', '')
                        text = abstract_text.text or ''
                        
                        if text.strip():
                            if label:
                                abstract_parts.append(f"{label}: {text}")
                            else:
                                abstract_parts.append(text)
                    
                    if abstract_parts:
                        abstracts[pmid_text] = '\n\n'.join(abstract_parts)
        
        except Exception as e:
            print(f"Error parsing abstracts: {e}")
        
        return abstracts
    
    def _is_top_journal(self, journal_name: str) -> bool:
        """Check if journal is in top journals database."""
        normalized = self._normalize_journal_name(journal_name)
        return normalized in self.journal_lookup
    
    def _get_journal_metadata(self, journal_name: str) -> Dict:
        """Get journal metadata (JIF, quartile, category) if available."""
        normalized = self._normalize_journal_name(journal_name)
        return self.journal_lookup.get(normalized, {})


def create_article_card(article: Dict) -> str:
    """Create HTML card for article display."""
    title = article['title']
    journal = article['journal']
    year = article['year']
    article_type = article['type']
    abstract = article['abstract']
    pubmed_url = article['pubmed_url']
    
    # Create badges for JIF and quartile
    badges_html = ""
    if article['jif'] is not None:
        badges_html += f'<span class="badge jif-badge">JIF {article["jif"]}</span> '
    if article['quartile']:
        badges_html += f'<span class="badge quartile-badge">{article["quartile"]}</span> '
    
    # Truncate abstract for display
    abstract_preview = abstract[:300] + "..." if len(abstract) > 300 else abstract
    
    card_html = f"""
    <div class="article-card">
        <h3><a href="{pubmed_url}" target="_blank" class="article-title">{title}</a></h3>
        <div class="article-meta">
            <strong>{journal}</strong> • {year} • {article_type}
            {badges_html}
        </div>
        <details class="abstract-details">
            <summary class="abstract-summary">Abstract</summary>
            <div class="abstract-content">{abstract_preview}</div>
        </details>
    </div>
    """
    
    return card_html


def sort_articles(articles: List[Dict], sort_option: str) -> List[Dict]:
    """Sort articles based on the selected option."""
    
    if sort_option == "Default (by relevance)":
        # Keep original order (already sorted by PubMed relevance)
        return articles
    
    elif sort_option == "JIF (High to Low)":
        # Sort by JIF descending, with articles without JIF at the end
        return sorted(articles, key=lambda x: x.get('jif', 0) or 0, reverse=True)
    
    elif sort_option == "JIF (Low to High)":
        # Sort by JIF ascending, with articles without JIF at the beginning
        return sorted(articles, key=lambda x: x.get('jif', 0) or 0, reverse=False)
    
    elif sort_option == "Quartile (Q1 to Q4)":
        # Sort by quartile: Q1, Q2, Q3, Q4, then articles without quartile
        quartile_order = {'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4}
        return sorted(articles, key=lambda x: quartile_order.get(x.get('quartile'), 999))
    
    elif sort_option == "Quartile (Q4 to Q1)":
        # Sort by quartile: Q4, Q3, Q2, Q1, then articles without quartile
        quartile_order = {'Q4': 1, 'Q3': 2, 'Q2': 3, 'Q1': 4}
        return sorted(articles, key=lambda x: quartile_order.get(x.get('quartile'), 999))
    
    else:
        # Default fallback
        return articles


def search_interface(query: str, article_type: str, humans_only: bool, open_access: bool,
                    years_back: int, max_results: int, show_all_journals: bool, sort_by: str) -> Tuple[str, str]:
    """Main search interface function."""
    
    # Show loading state
    loading_html = """
    <div style="text-align: center; padding: 3rem; color: #667eea;">
        <div style="font-size: 1.2rem; margin-bottom: 1rem;">🔍 Searching PubMed...</div>
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #e0e6ff; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">Please wait while we fetch your results</div>
    </div>
    <style>
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    </style>
    """
    
    # Initialize searcher
    searcher = PubMedSearcher()
    
    # Perform search
    status_message, articles = searcher.search_pubmed(
        query, article_type, humans_only, open_access, years_back, max_results, show_all_journals
    )
    
    # Create HTML output
    if not articles:
        return status_message, ""
    
    # Sort articles based on user selection
    articles = sort_articles(articles, sort_by)
    
    # Add CSS styling
    css_style = """
    <style>
    .article-card {
        border: none;
        border-radius: 20px;
        padding: 24px;
        margin: 20px 0;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        border-left: 5px solid #667eea;
    }
    
    .article-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 48px rgba(0,0,0,0.15);
    }
    
    .article-title {
        color: #1976d2;
        text-decoration: none;
        font-size: 1.3em;
        line-height: 1.4;
        font-weight: 700;
        margin-bottom: 12px;
        display: block;
        transition: all 0.3s ease;
    }
    
    .article-title:hover {
        color: #1565c0;
        text-decoration: none;
        transform: translateX(4px);
    }
    
    .article-meta {
        color: #424242;
        margin: 12px 0;
        font-size: 1em;
        font-weight: 600;
        background: #f0f4ff;
        padding: 8px 16px;
        border-radius: 12px;
        border: 1px solid #e0e6ff;
    }
    
    .badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.85em;
        font-weight: 700;
        margin-left: 10px;
        text-shadow: none;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .badge:hover {
        transform: scale(1.05);
    }
    
    .jif-badge {
        background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
        color: white;
    }
    
    .quartile-badge {
        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
        color: white;
    }
    
    .abstract-details {
        margin-top: 16px;
        background: white;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e0e6ff;
    }
    
    .abstract-summary {
        cursor: pointer;
        color: #1976d2;
        font-weight: 700;
        font-size: 1.1em;
        padding: 8px 16px;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-radius: 8px;
        border: 1px solid #90caf9;
        transition: all 0.3s ease;
        display: inline-block;
        margin-bottom: 8px;
    }
    
    .abstract-summary:hover {
        color: #1565c0;
        background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
        transform: translateY(-1px);
    }
    
    .abstract-content {
        margin-top: 12px;
        line-height: 1.7;
        color: #212121;
        font-size: 0.95em;
        background: #fafafa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .status-message {
        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
        border: 2px solid #4caf50;
        border-radius: 15px;
        padding: 20px;
        margin: 20px 0;
        font-weight: 700;
        color: black !important;
        font-size: 1.1em;
        text-align: center;
        box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
    }
    
    .status-message * {
        color: black !important;
    }
    
    .status-message span {
        color: black !important;
    }
    
    /* Ensure text is visible on all backgrounds */
    body, html {
        color: #212121 !important;
    }
    
    /* Make sure article details are clearly visible */
    .article-card * {
        color: #212121 !important;
    }
    
    .article-title {
        color: #1976d2 !important;
    }
    
    .abstract-summary {
        color: #1976d2 !important;
    }
    
    /* Add some animation */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .article-card {
        animation: fadeInUp 0.6s ease-out;
    }
    </style>
    """
    
    # Create articles HTML with properly formatted status message
    formatted_status = f"<span style='color: black !important;'>{status_message}</span>"
    articles_html = css_style + "<div class='status-message'>" + formatted_status + "</div>"
    
    for article in articles:
        articles_html += create_article_card(article)
    
    return status_message, articles_html


def create_gradio_interface():
    """Create and configure the Gradio interface."""
    
    # Custom CSS for enhanced styling
    custom_css = """
    .gradio-container {
        background: #000000;
        min-height: 100vh;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .main-header {
        background: #1a1a1a;
        color: white;
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 8px 32px rgba(255,255,255,0.1);
        text-align: center;
        border: 1px solid #333333;
    }
    
    .main-header h1 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 700;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .main-header p {
        margin: 0.5rem 0 0 0;
        font-size: 1.1rem;
        opacity: 0.9;
    }
    
    
    .info-panel {
        background: #1a1a1a;
        color: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 10px 40px rgba(255,255,255,0.1);
        margin-bottom: 2rem;
        border: 1px solid #333333;
    }
    
    .search-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 20px;
        padding: 1.2rem 3rem;
        color: white;
        font-size: 1.3rem;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        overflow: hidden;
        width: 100%;
        margin-top: 1rem;
    }
    
    .search-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.6);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }
    
    .search-button:active {
        transform: translateY(-1px);
    }
    
    .search-button.loading {
        pointer-events: none;
        opacity: 0.8;
    }
    
    .search-button.loading::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        top: 50%;
        left: 50%;
        margin-left: -10px;
        margin-top: -10px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    
    """
    
    with gr.Blocks(title="PubMed Search Engine", theme=gr.themes.Soft(), css=custom_css) as app:
        
        # Main Header
        with gr.Row():
            with gr.Column():
                gr.HTML("""
                <div class="main-header">
                    <h1>🔬 PubMed Search Engine</h1>
                    <p>Search PubMed and filter results to show only articles from high-impact journals.<br>
                    Perfect for students and researchers who want to focus on the most credible research.</p>
                </div>
                """)
        
        with gr.Row():
            with gr.Column(scale=3):
                # Search Panel
                with gr.Column():
                    query_input = gr.Textbox(
                        label="🔍 Search Query",
                        placeholder="Enter keywords (e.g., 'GLP-1 obesity meta-analysis')",
                        lines=2
                    )
                    
                    with gr.Row():
                        article_type = gr.Dropdown(
                            choices=["", "Research Article", "RCT", "Randomized Controlled Trial", "Meta-Analysis", 
                                    "Systematic Review", "Clinical Trial", "Review"],
                            label="📄 Article Type Filter",
                            value=""
                        )
                        
                        humans_only = gr.Checkbox(
                            label="👥 Humans Only",
                            value=True,
                            info="Exclude animal studies"
                        )
                    
                    open_access = gr.Checkbox(
                        label="🔓 Open Access Only",
                        value=False,
                        info="Show only freely accessible articles"
                    )
                    
                    with gr.Row():
                        years_back = gr.Slider(
                            minimum=1, maximum=15, value=5, step=1,
                            label="📅 Years Back",
                            info="How many years to search"
                        )
                        
                        max_results = gr.Slider(
                            minimum=10, maximum=100, value=50, step=10,
                            label="📊 Max Results",
                            info="Maximum articles to return"
                        )
                    
                    with gr.Row():
                        show_all_journals = gr.Checkbox(
                            label="🌐 Show All Journals",
                            value=False,
                            info="Show all journals (not just top journals)"
                        )
                        
                        sort_by = gr.Dropdown(
                            choices=["Default (by relevance)", "JIF (High to Low)", "JIF (Low to High)", "Quartile (Q1 to Q4)", "Quartile (Q4 to Q1)"],
                            label="📈 Sort Results By",
                            value="Default (by relevance)"
                        )
                    
                    search_button = gr.Button("🔍 Search PubMed", variant="primary", size="lg", elem_classes="search-button")
            
            with gr.Column(scale=1):
                # Info Panel
                with gr.Column():
                    gr.HTML("""
                    <div class="info-panel">
                        <h3 style="margin-top: 0; color: white;">📊 About Journal Rankings</h3>
                        <div style="color: white;">
                            <p><strong>Q1 (Quartile 1):</strong> Top 25% of journals</p>
                            <p><strong>Q2 (Quartile 2):</strong> 25-50th percentile</p>
                            <p><strong>Q3 (Quartile 3):</strong> 50-75th percentile</p>
                            <p><strong>Q4 (Quartile 4):</strong> Bottom 25%</p>
                            <br>
                            <p><strong>Higher JIF = More influential journal</strong></p>
                        </div>
                    </div>
                    """)
        
        # Results section
        with gr.Row():
            with gr.Column():
                status_output = gr.Markdown(label="Search Status")
                results_output = gr.HTML(label="Search Results")
        
        # Event handlers
        search_button.click(
            fn=search_interface,
            inputs=[query_input, article_type, humans_only, open_access, years_back, max_results, show_all_journals, sort_by],
            outputs=[status_output, results_output]
        )
        
        # Example queries
        with gr.Row():
            with gr.Column():
                gr.Examples(
                    examples=[
                        ["GLP-1 obesity meta-analysis", "Meta-Analysis", True, False, 5, 50, False, "JIF (High to Low)"],
                        ["COVID-19 vaccine efficacy RCT", "RCT", True, False, 3, 30, False, "Quartile (Q1 to Q4)"],
                        ["machine learning healthcare", "Research Article", True, True, 10, 50, True, "Default (by relevance)"],
                        ["diabetes prevention systematic review", "Systematic Review", True, False, 8, 40, False, "JIF (High to Low)"]
                    ],
                    inputs=[query_input, article_type, humans_only, open_access, years_back, max_results, show_all_journals, sort_by],
                    label="💡 Example Queries"
                )
        
        # Footer
        with gr.Row():
            with gr.Column():
                gr.Markdown("""
                ---
                <div style="text-align: center; color: #666; padding: 2rem;">
                **🔗 Data Sources:** PubMed (NCBI) • Journal Impact Factors 2024<br>
                **💡 Tips:** Use specific medical terms for better results • Try "Show All Journals" if you get few results<br>
                **📱 Mobile Friendly:** Works great on all devices
                </div>
                """)
    
    return app


def main():
    """Main application entry point."""
    print("Starting PubMed Top Journals Student App...")
    
    # Create Gradio interface
    app = create_gradio_interface()
    
    # Launch the app
    # For Hugging Face Spaces, try different port configurations
    import os
    import socket
    
    def find_free_port():
        """Find a free port starting from 7860"""
        for port in range(7860, 7870):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', port))
                    return port
            except OSError:
                continue
        return None
    
    # Try environment variable first, then find free port
    port = os.environ.get("GRADIO_SERVER_PORT")
    if port:
        port = int(port)
    else:
        port = find_free_port()
        if not port:
            port = 7860  # fallback
    
    print(f"Starting server on port {port}")
    
    app.launch(
        server_name="0.0.0.0",
        server_port=port,
        share=False,
        show_error=True,
        quiet=False
    )


if __name__ == "__main__":
    main()
