# Hugging Face Spaces Deployment Guide

This guide will help you deploy the PubMed Top Journals Student App to Hugging Face Spaces.

## 🚀 Quick Deployment Steps

### 1. Prepare Your Files

Make sure you have these three essential files ready:
- `app.py` (main application)
- `requirements.txt` (dependencies)
- `journal_impact_factors/top_journals.json` (journal data)

### 2. Create a New Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Fill in the details:
   - **Space name:** `pubmed-topjournals-app` (or your preferred name)
   - **License:** MIT
   - **SDK:** Gradio
   - **Hardware:** CPU Basic (free tier)
   - **Visibility:** Public (or Private if you prefer)

### 3. Upload Your Files

Upload the three required files to your Space:
- Drag and drop `app.py` to the root directory
- Drag and drop `requirements.txt` to the root directory  
- Drag and drop `journal_impact_factors/` folder (containing `top_journals.json`)

### 4. Configure Environment Variables

1. Go to your Space settings
2. Navigate to the "Variables and secrets" tab
3. Add these environment variables:

```
NCBI_TOOL_NAME=pubmed-topjournals-student-app
NCBI_CONTACT_EMAIL=your-email@example.com
NCBI_API_KEY=your-api-key-here
```

**Important Notes:**
- Replace `your-email@example.com` with your actual email
- The API key is optional but recommended for higher rate limits
- Keep your email and API key private (they're stored securely)

### 5. Deploy and Test

1. Your Space will automatically build and deploy
2. Wait for the build to complete (usually 2-5 minutes)
3. Test your app with a sample query like: "GLP-1 obesity meta-analysis"
4. Verify that:
   - Search results appear
   - Journal badges show correctly
   - Abstracts are expandable
   - Links to PubMed work

## 🔧 Troubleshooting Deployment

### Common Issues

**Build fails with "Module not found"**
- Check that `requirements.txt` includes all dependencies
- Verify file names are exactly correct (case-sensitive)

**App starts but shows errors**
- Check the Space logs for error messages
- Verify environment variables are set correctly
- Test with a simple query first

**No results appear**
- Check NCBI API status
- Verify your email is valid in environment variables
- Try reducing the number of results

**Journal badges not showing**
- Verify `journal_impact_factors/top_journals.json` is uploaded correctly
- Check the file path in your code matches the upload structure

### Getting Help

1. **Check the logs:** Go to your Space → "Logs" tab
2. **Test locally first:** Make sure the app works on your computer
3. **Community support:** Ask questions in Hugging Face discussions

## 📊 Space Configuration

### Recommended Settings

- **Hardware:** CPU Basic (sufficient for this app)
- **Auto-restart:** Enabled (helps with temporary API issues)
- **Sleep mode:** Disabled (keeps app always available)

### Cost Considerations

- **CPU Basic:** Free tier, good for development and small usage
- **CPU Upgrade:** $0.60/hour if you need more resources
- **GPU:** Not needed for this application

## 🔄 Updating Your Deployment

To update your deployed app:

1. **Modify files locally**
2. **Upload new versions** to your Space
3. **Redeploy automatically** (Spaces auto-detects changes)

### Version Control Tips

- Use Git integration for easier updates
- Tag releases for better version management
- Keep a changelog of updates

## 🌐 Sharing Your App

Once deployed, you can:

1. **Share the URL** with students and researchers
2. **Embed in websites** using iframe
3. **Add to collections** on Hugging Face
4. **Submit to directories** like Awesome Gradio Apps

## 📈 Monitoring Usage

Monitor your Space usage:

1. **Analytics tab:** See how many people use your app
2. **Logs tab:** Check for errors and usage patterns
3. **Settings tab:** Monitor resource usage and costs

## 🎯 Best Practices

### For Students/Researchers
- Always include your email in environment variables
- Respect NCBI rate limits (the app handles this automatically)
- Test thoroughly before sharing widely

### For Educators
- Consider making Spaces private for classroom use
- Monitor usage to ensure fair access
- Provide clear instructions to students

## 🔒 Security Notes

- **Environment variables are secure** - they're not visible to users
- **API keys are protected** - stored securely by Hugging Face
- **No user data is stored** - the app doesn't save searches or results

## 📞 Support Resources

- **Hugging Face Docs:** [Spaces Documentation](https://huggingface.co/docs/hub/spaces)
- **Gradio Docs:** [Gradio Documentation](https://gradio.app/docs/)
- **NCBI API Docs:** [E-utilities Documentation](https://www.ncbi.nlm.nih.gov/books/NBK25501/)

---

**Ready to deploy?** Follow the steps above and you'll have your PubMed search app live on Hugging Face Spaces in minutes! 🚀
