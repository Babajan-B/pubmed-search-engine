# Product Requirement Document (PRD)
## PubMed Top Journals Student App

### 1. Project Overview

**Project Name:** pubmed-topjournals-student-app  
**Version:** 1.0  
**Date:** January 2025  
**Target Audience:** Students and researchers in medical/scientific fields  

### 2. Problem Statement

Students and researchers need a simple, beginner-friendly tool to search PubMed and filter results to only show articles from high-impact journals. Current PubMed interfaces are complex and don't provide easy filtering by journal impact factor or quartile rankings.

### 3. Solution Overview

A Gradio-based web application that:
- Searches PubMed using NCBI E-utilities
- Filters results to show only top-tier journals (based on Journal Impact Factor data)
- Displays results with journal rankings and impact factors
- Provides a clean, student-friendly interface

### 4. Core Features

#### 4.1 Search Functionality
- **Text search:** Keyword-based search of PubMed database
- **Article type filtering:** RCT, Meta-Analysis, Systematic Review, Clinical Trial, Review
- **Human studies only:** Toggle to filter out animal studies (default: ON)
- **Year range:** Slider to specify how many years back to search (1-15 years, default: 5)
- **Result limit:** Maximum number of results to display (10-100, default: 50)

#### 4.2 Journal Filtering
- **Top journals mode (default):** Show only articles from journals in the top journals JSON file
- **All journals mode:** Toggle to show all journals but still display JIF/Quartile badges for top journals
- **Journal matching:** Intelligent matching using canonical names and aliases

#### 4.3 Results Display
- **Metrics header:** Shows total found → after filters → kept (with mode indicator)
- **Article cards** containing:
  - Title (clickable link to PubMed)
  - Journal name
  - Publication year
  - Article type
  - JIF badge (when available)
  - Quartile badge (when available)
  - Expandable abstract

#### 4.4 Data Integration
- **Journal Impact Factor data:** Uses provided JSON file with 20,449 journals
- **PubMed integration:** Real-time search using NCBI E-utilities API
- **Error handling:** Graceful handling of API failures and edge cases

### 5. Technical Requirements

#### 5.1 Technology Stack
- **Frontend/Backend:** Gradio (Python web framework)
- **Data processing:** Pandas, Requests
- **XML parsing:** lxml
- **Configuration:** python-dotenv

#### 5.2 API Integration
- **NCBI E-utilities:** E-Search, E-Summary, E-Fetch
- **Rate limiting:** Polite delays between API calls
- **Error handling:** Retry logic and user-friendly error messages

#### 5.3 Performance Requirements
- **Response time:** < 10 seconds for typical queries
- **Batch processing:** Efficient API calls with batching
- **Memory usage:** Minimal memory footprint for journal data

### 6. User Experience Requirements

#### 6.1 Interface Design
- **Beginner-friendly:** Simple, intuitive interface
- **Responsive:** Works on desktop and mobile devices
- **Accessible:** Clear labels and logical flow

#### 6.2 User Workflow
1. Enter search query
2. Adjust filters as needed
3. Choose journal filtering mode
4. Click search
5. Review results with journal rankings
6. Click on titles to access full articles on PubMed

### 7. Data Requirements

#### 7.1 Journal Data
- **Source:** Journal Impact Factor 2024.xlsx (converted to JSON)
- **Fields:** name, aliases, category, quartile, jif
- **Size:** 20,449 journals
- **Update frequency:** Annual

#### 7.2 PubMed Data
- **Real-time access:** Via NCBI E-utilities API
- **Fields retrieved:** title, journal, year, type, abstract
- **Rate limits:** Respect NCBI guidelines

### 8. Deployment Requirements

#### 8.1 Local Development
- **Environment:** Python virtual environment
- **Dependencies:** requirements.txt
- **Configuration:** .env file for API settings

#### 8.2 Production Deployment
- **Platform:** Hugging Face Spaces
- **Requirements:** app.py, requirements.txt, journal data JSON
- **Environment variables:** NCBI API credentials

### 9. Success Metrics

#### 9.1 Functional Metrics
- **Search accuracy:** Results match query intent
- **Journal filtering:** Correctly identifies top journals
- **Error rate:** < 5% API failures

#### 9.2 User Experience Metrics
- **Usability:** Students can complete searches without assistance
- **Performance:** Fast response times
- **Reliability:** Consistent uptime

### 10. Future Enhancements

#### 10.1 Phase 2 Features
- **Saved searches:** Allow users to save and revisit searches
- **Export functionality:** Download results as CSV/PDF
- **Advanced filters:** More granular filtering options

#### 10.2 Phase 3 Features
- **User accounts:** Personalized experience
- **Search history:** Track previous searches
- **Recommendations:** Suggest related articles

### 11. Risks and Mitigation

#### 11.1 Technical Risks
- **API rate limits:** Implement polite delays and retry logic
- **Data accuracy:** Regular validation of journal matching
- **Performance:** Optimize API calls and caching

#### 11.2 User Risks
- **Learning curve:** Provide clear documentation and examples
- **Data overload:** Limit results and provide clear filtering

### 12. Acceptance Criteria

- [ ] App successfully searches PubMed and returns results
- [ ] Top journal filtering works correctly
- [ ] JIF and Quartile badges display for matching journals
- [ ] All filters function as specified
- [ ] Error handling provides helpful messages
- [ ] App deploys successfully to Hugging Face Spaces
- [ ] Documentation is clear and complete
- [ ] App works on both desktop and mobile devices
