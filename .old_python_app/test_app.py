#!/usr/bin/env python3
"""
Test script to debug the PubMed app
"""

import json
import os
from app import PubMedSearcher

def test_journal_loading():
    """Test if journal data loads correctly."""
    print("Testing journal data loading...")
    
    try:
        with open('journal_impact_factors/top_journals.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Successfully loaded {len(data)} journals")
        
        # Show first few journals
        print("\nFirst 3 journals:")
        for i, journal in enumerate(data[:3]):
            print(f"{i+1}. {journal['name']} - JIF: {journal['jif']} - {journal['quartile']}")
        
        return True
    except Exception as e:
        print(f"❌ Error loading journal data: {e}")
        return False

def test_searcher_initialization():
    """Test PubMedSearcher initialization."""
    print("\nTesting PubMedSearcher initialization...")
    
    try:
        searcher = PubMedSearcher()
        print(f"✅ PubMedSearcher initialized successfully")
        print(f"📊 Journal lookup contains {len(searcher.journal_lookup)} entries")
        
        # Test journal normalization
        test_journal = "Nature Reviews Microbiology"
        normalized = searcher._normalize_journal_name(test_journal)
        print(f"🔍 Normalized '{test_journal}' to '{normalized}'")
        
        # Test journal matching
        if normalized in searcher.journal_lookup:
            metadata = searcher.journal_lookup[normalized]
            print(f"✅ Found journal metadata: JIF {metadata['jif']}, {metadata['quartile']}")
        else:
            print("❌ Journal not found in lookup")
        
        return True
    except Exception as e:
        print(f"❌ Error initializing PubMedSearcher: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_simple_search():
    """Test a simple search."""
    print("\nTesting simple search...")
    
    try:
        searcher = PubMedSearcher()
        
        # Test with a simple query
        status, results = searcher.search_pubmed(
            query="COVID-19",
            article_type="",
            humans_only=True,
            years_back=2,
            max_results=5,
            show_all_journals=True
        )
        
        print(f"📊 Search status: {status}")
        print(f"📊 Found {len(results)} results")
        
        if results:
            print("\nFirst result:")
            first_result = results[0]
            print(f"  Title: {first_result['title'][:100]}...")
            print(f"  Journal: {first_result['journal']}")
            print(f"  Year: {first_result['year']}")
            print(f"  JIF: {first_result.get('jif', 'N/A')}")
            print(f"  Quartile: {first_result.get('quartile', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"❌ Error in search: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔬 PubMed App Debug Test")
    print("=" * 50)
    
    # Test 1: Journal data loading
    journal_ok = test_journal_loading()
    
    if journal_ok:
        # Test 2: Searcher initialization
        searcher_ok = test_searcher_initialization()
        
        if searcher_ok:
            # Test 3: Simple search
            test_simple_search()
    
    print("\n" + "=" * 50)
    print("Test completed!")
