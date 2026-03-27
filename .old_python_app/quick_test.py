#!/usr/bin/env python3
"""
Quick test of the search interface function
"""

from app import search_interface

def test_search_interface():
    """Test the search interface function directly."""
    print("Testing search interface function...")
    
    try:
        # Test with a simple query
        status, html = search_interface(
            query="GLP-1 obesity meta-analysis",
            article_type="Meta-Analysis",
            humans_only=True,
            years_back=5,
            max_results=10,
            show_all_journals=False
        )
        
        print(f"Status: {status}")
        print(f"HTML length: {len(html)} characters")
        
        if html:
            print("✅ Search returned HTML results")
            # Check if HTML contains expected elements
            if "article-card" in html:
                print("✅ Found article cards in HTML")
            if "JIF" in html:
                print("✅ Found JIF badges in HTML")
            if "Q1" in html or "Q2" in html or "Q3" in html or "Q4" in html:
                print("✅ Found quartile badges in HTML")
        else:
            print("❌ No HTML results returned")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in search interface: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_search_interface()
