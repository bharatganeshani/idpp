# QUICK START GUIDE

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend Server
```bash
cd backend
python app.py
```
You'll see: `Running on http://127.0.0.1:5000`

### Step 2: Open the Frontend
Open this file in your browser:
```
frontend/index.html
```
OR serve it:
```bash
cd frontend
python -m http.server 8000
# Then visit http://localhost:8000
```

### Step 3: Start Classifying!
- **ML Classifier Tab**: Enter title + description → Quick local classification
- **AI Classifier Tab**: Upload book content → Get detailed AI analysis

---

## 📋 What You Can Do

### Upload Book Content
- `.txt` files (plain text)
- `.md` files (markdown)
- Direct text input
- Up to 8000 characters

### Get AI Analysis Including
✅ Primary & secondary categories
✅ Themes and keywords
✅ Content type and difficulty level
✅ Target audience
✅ 3-5 key insights
✅ Estimated reading time
✅ Related topics
✅ Confidence score

---

## 🔍 Example Usage

### Try with Python/Terminal
```bash
# Quick ML classification
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Artificial Intelligence",
    "description": "A comprehensive guide to AI and machine learning concepts"
  }'

# Detailed AI analysis
curl -X POST http://localhost:5000/classify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quantum Computing",
    "content": "This book explores quantum mechanics principles..."
  }'
```

---

## 🧪 Run Tests
```bash
python test_api.py
```
This validates:
- Backend connection
- ML classifier
- AI classifier
- File upload

---

## 📚 Full Documentation

- **Detailed API Guide**: `USAGE.md`
- **Implementation Details**: `IMPLEMENTATION.md`
- **Project README**: `README.md`

---

## ⚡ Troubleshooting

**Backend won't start:**
- Make sure you're in the `backend` folder
- Check if port 5000 is available
- Run: `python app.py`

**API connection error:**
- Verify `.env` has correct credentials
- Check internet connection
- Test API: `curl https://integrate.api.nvidia.com/v1/chat/completions`

**Frontend won't load:**
- Use Firefox or Chrome
- Try serving with Python: `python -m http.server 8000`
- Check browser console for errors

**AI Analysis too slow:**
- Takes 5-10 seconds (normal for API calls)
- Shorter content processes faster
- First request might be slower

---

## 📊 System Status

✅ Backend: Ready
✅ API Endpoints: Ready
✅ Frontend: Ready
✅ AI Integration: Ready
✅ ML Classifier: Ready
✅ File Upload: Ready

---

## 🎯 Key Features

| Feature | Status | Speed | Notes |
|---------|--------|-------|-------|
| ML Classification | ✓ | ~100ms | Local, no API call |
| AI Analysis | ✓ | 5-10s | Comprehensive output |
| File Upload | ✓ | Variable | .txt, .md support |
| Text Input | ✓ | Instant | Any length |
| Categories | ✓ | Auto | 8+ predefined |

---

## 💡 Pro Tips

1. **Use ML for speed**: When you just need quick categorization
2. **Use AI for details**: When you need comprehensive analysis
3. **Upload files**: For longer content (more accurate)
4. **Test both**: Compare ML vs AI results

---

## 📞 Quick Help

- Check logs in terminal for errors
- Browser console (F12) shows client errors
- Test API directly with curl
- Run `python test_api.py` to validate

---

**Ready to use!** 🎉

Open `frontend/index.html` and start classifying books!
