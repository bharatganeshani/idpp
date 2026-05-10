# AI-Based Book Classification System - Usage Guide

## Overview
This system provides two classification methods for analyzing book content:
1. **ML Classifier** - Fast local classification using TF-IDF + Logistic Regression
2. **AI-Powered Classifier** - Detailed AI analysis using OpenAI-compatible endpoints (Nvidia Kimi)

## Setup

### Prerequisites
- Python 3.10+
- Virtual environment with dependencies installed

### Configuration
Your API credentials are already set in `.env`:
- `api_endpoint`: Nvidia API endpoint (OpenAI-compatible)
- `api_key`: Your Nvidia API key
- `model`: Using Kimi K2.6 model

## Running the Application

### 1. Start Backend Server
```bash
cd backend
python app.py
```
Server will run on `http://localhost:5000`

### 2. Open Frontend
Open `frontend/index.html` in your browser or serve it with:
```bash
cd frontend
python -m http.server 8000
```
Then visit `http://localhost:8000`

## API Endpoints

### 1. Health Check
```
GET /health
```
Returns system status and model metrics.

### 2. ML Classification
```
POST /predict
Content-Type: application/json

{
  "title": "Deep Learning Fundamentals",
  "description": "An introduction to neural networks and deep learning concepts..."
}
```

**Response:**
```json
{
  "category": "Technology",
  "confidence": 0.92,
  "model": "TF-IDF + Logistic Regression",
  "metrics": { "accuracy": 0.92, "precision": 0.89, ... }
}
```

### 3. AI-Powered Text Classification
```
POST /classify
Content-Type: application/json

{
  "title": "Machine Learning in Practice",
  "content": "Full book content or summary (up to 8000 chars)..."
}
```

**Response:** Comprehensive analysis including:
- Primary & secondary categories
- Themes and keywords
- Target audience and difficulty level
- Key insights and related topics
- Confidence score

### 4. File Upload Classification
```
POST /upload-and-classify
Content-Type: multipart/form-data

- file: Book content file (.txt or .md)
- title: Book title (optional)
```

## Usage Examples

### Example 1: Classify with ML Model (Quick)
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Programming",
    "description": "Learn Python from basics to advanced concepts including OOP, functional programming, and web development."
  }'
```

### Example 2: Detailed AI Analysis
```bash
curl -X POST http://localhost:5000/classify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quantum Computing Basics",
    "content": "This book explores the fundamentals of quantum computing, including qubits, superposition, entanglement, quantum gates, and their applications in solving computational problems..."
  }'
```

### Example 3: Upload and Classify File
```bash
curl -X POST http://localhost:5000/upload-and-classify \
  -F "file=@mybook.txt" \
  -F "title=My Book Title"
```

## Frontend Usage

### ML Classifier Tab
1. Enter book title
2. Enter book description (or upload a .txt file)
3. Click "Classify Book"
4. See instant classification result

### AI-Powered Classifier Tab
1. Enter book title (optional)
2. Paste book content or upload a file (.txt or .md)
3. Click "Analyze with AI"
4. Get detailed analysis with:
   - Primary and secondary categories
   - Themes and keywords
   - Content type and difficulty level
   - Target audience
   - Key insights
   - Related topics
   - Reading time estimate

## AI Analysis Output Includes

- **Primary Category**: Main classification (Technology, Science, History, Business, etc.)
- **Secondary Categories**: Other relevant categories
- **Themes**: Main themes identified in the content
- **Keywords**: Subject keywords and topics
- **Content Type**: Academic, Guide, Reference, Narrative, etc.
- **Difficulty Level**: Beginner, Intermediate, Advanced
- **Target Audience**: Who benefits from this book
- **Key Insights**: 3-5 main takeaways
- **Reading Time**: Estimated hours to read
- **Related Topics**: Books/topics this relates to
- **Confidence Score**: AI confidence in the analysis

## Performance Notes

- **ML Classifier**: ~100ms (local processing)
- **AI Classifier**: ~3-10s (depends on API response time)
- Maximum content: 8000 characters per analysis
- API limits apply to OpenAI-compatible endpoint

## Troubleshooting

### API Connection Error
- Verify `.env` file has correct API credentials
- Check network connection to Nvidia API
- Ensure base_url is correct (without `/v1/chat/completions`)

### CORS Issues
- Backend automatically enables CORS headers
- If still failing, check browser console for specific errors

### Timeout
- API responses might take 5-10 seconds
- If timeout occurs, the frontend has 30-second timeout for AI requests

## File Format Support

**ML Classifier**: Title + description text
**AI Classifier**: 
- Text input (paste content)
- `.txt` files (plain text)
- `.md` files (markdown)

Maximum file size: 8000 characters (automatically truncated if larger)

## Categories Supported

- Technology
- Science
- History
- Business
- Philosophy
- Fiction
- Self-Help
- And more (AI model determines based on content)

## API Limits

- Request timeout: 30 seconds
- Max content length: 8000 characters
- Max tokens in response: 1500
- Temperature: 0.7 (balanced creativity)

## Development

To modify the classification behavior:

1. **ML Classifier**: Edit SAMPLES in `app.py` to train on different data
2. **AI Classifier**: Modify the prompt in `/classify` endpoint
3. **Frontend**: Update `script.js` and `styles.css` for UI changes

## Support

For API issues, refer to:
- Nvidia API Documentation
- OpenAI API Compatibility Docs
- Flask Documentation
