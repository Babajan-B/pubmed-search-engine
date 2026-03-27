# PubMed Top Journals Student App

A beginner-friendly Gradio application that searches PubMed and filters results to show only articles from high-impact journals. Perfect for students and researchers who want to focus on the most credible and influential research.

## 🎯 What This App Does

- **Searches PubMed** using keywords and filters
- **Filters to top journals** based on Journal Impact Factor (JIF) data
- **Shows journal rankings** with JIF and Quartile badges
- **Displays clean results** with expandable abstracts
- **Provides direct links** to full articles on PubMed

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Internet connection for PubMed API access

### Local Installation

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd pubmed-topjournals-student-app
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (optional but recommended)
   ```bash
   cp .env.example .env
   # Edit .env with your NCBI contact information
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser** and go to the URL shown in the terminal (usually `http://127.0.0.1:7860`)

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables for polite NCBI API usage:

```env
NCBI_TOOL_NAME=your-app-name
NCBI_CONTACT_EMAIL=your-email@example.com
NCBI_API_KEY=your-api-key  # Optional but recommended
```

**Why these are important:**
- NCBI requires identification for API usage
- Helps with rate limiting and troubleshooting
- API key allows higher rate limits

### Getting NCBI API Key (Optional)
1. Visit [NCBI API Key Management](https://www.ncbi.nlm.nih.gov/account/settings/)
2. Create an NCBI account if you don't have one
3. Generate an API key
4. Add it to your `.env` file

## 📖 How to Use

### Basic Search
1. Enter your search terms (e.g., "GLP-1 obesity meta-analysis")
2. Click "Search PubMed"
3. Review the filtered results from top journals

### Advanced Filters
- **Article Type:** Filter by RCT, Meta-Analysis, Systematic Review, etc.
- **Humans Only:** Toggle to exclude animal studies (default: ON)
- **Years Back:** How many years to search (1-15, default: 5)
- **Max Results:** Maximum number of results (10-100, default: 50)
- **Show All Journals:** Toggle to see all journals, not just top ones

### Understanding Results
- **Title:** Click to open the full article on PubMed
- **Journal badges:** JIF (Journal Impact Factor) and Quartile (Q1-Q4)
- **Abstract:** Click to expand and read the full abstract
- **Metrics:** Shows how many articles were found and filtered

## 🏥 About Journal Rankings

The app uses Journal Impact Factor (JIF) data from 2024:
- **Q1 (Quartile 1):** Top 25% of journals in their category
- **Q2 (Quartile 2):** 25-50th percentile
- **Q3 (Quartile 3):** 50-75th percentile  
- **Q4 (Quartile 4):** Bottom 25%

Higher JIF numbers indicate more influential journals in their field.

## 🚨 Troubleshooting

### Common Issues

**"No results found"**
- Try broader search terms
- Increase the "Years Back" slider
- Turn on "Show All Journals" to see more results
- Check your internet connection

**"API rate limit exceeded"**
- Wait a few minutes and try again
- Add your NCBI API key to `.env` for higher limits
- Reduce the "Max Results" setting

**"Journal badges not showing"**
- Some journals may not be in our database
- This is normal and doesn't affect the quality of results

**App won't start**
- Make sure you're in the virtual environment
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify Python version is 3.8 or higher

### Getting Help

If you encounter issues:
1. Check the terminal/console for error messages
2. Verify your `.env` configuration
3. Try reducing the search scope (fewer results, shorter time range)
4. Check NCBI service status if API calls are failing

## 📁 Project Structure

```
pubmed-topjournals-student-app/
├── app.py                           # Main Gradio application
├── requirements.txt                 # Python dependencies
├── README.md                        # This file
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── journal_impact_factors/
│   └── top_journals.json           # Journal ranking data
└── hf_space.md                      # Deployment guide
```

## 🔄 Development

### Running in Development Mode
```bash
python app.py --debug
```

### Adding New Features
1. Modify `app.py` for new functionality
2. Update `requirements.txt` for new dependencies
3. Test thoroughly before deployment
4. Update documentation as needed

## 📊 Data Sources

- **PubMed:** National Library of Medicine's database
- **Journal Impact Factors:** 2024 JCR (Journal Citation Reports)
- **API:** NCBI E-utilities (free, no authentication required)

## 🤝 Contributing

This is a student-friendly project designed for learning. Feel free to:
- Report bugs or issues
- Suggest improvements
- Fork and modify for your own use
- Share with other students and researchers

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- NCBI for providing free access to PubMed data
- Gradio team for the excellent web framework
- The scientific community for maintaining high-quality research databases

---

**Happy researching! 🔬📚**
