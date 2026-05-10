# 📚 AI-Based Automated Book Classification System

A modern NLP and AI-powered system for comprehensive book classification and analysis. Combines fast AI-powered analysis (via Nvidia/OpenAI-compatible API) with a built-in **Books Explorer** featuring a curated dataset of **100 books across 30 genres**.

---

## ✨ Features

### 🤖 AI Classification Engine
- Powered by **Nvidia / Kimi K2.6** OpenAI-compatible API
- Extracts: primary category, secondary categories, themes, keywords
- Returns: difficulty level, reading time estimate, target audience, key insights
- Supports text input, summary input, and `.txt / .md / .pdf` file uploads

### 📚 Books Explorer (NEW)
- **100 curated books** across **30 genres** built into the frontend
- Genre filter bar — click any genre to filter instantly
- Live search across title, author, and description
- **"Classify This"** button on every book — auto-fills the classifier
- Data served from `frontend/books_data.json` and also via the `/books` API endpoint

### 📊 Classification Output
- Primary & secondary categories
- Themes and subject keywords
- Content type & difficulty level
- Target audience
- Key insights (3–5 takeaways)
- Estimated reading time
- Related topics & comprehensive summary
- Confidence score (0–1)

---

## 📁 Project Structure

```
idpp-main/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   ├── users.db            # SQLite user database
│   └── .env                # API credentials (not committed)
├── frontend/
│   ├── index.html          # Main web interface
│   ├── login.html          # Login / Register page
│   ├── script.js           # UI logic + Books Explorer
│   ├── login.js            # Auth logic
│   ├── styles.css          # Styling
│   └── books_data.json     # 100-book dataset (30 genres)
├── goodreads_samples/      # Sample book text files
├── test_api.py             # API test suite
├── USAGE.md                # Detailed API documentation
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Dependencies installed (`pip install -r backend/requirements.txt`)

### 1. Configure API Key
Edit `backend/.env`:
```
api_endpoint=https://integrate.api.nvidia.com/v1/chat/completions
api_key=YOUR_NVIDIA_API_KEY
model=moonshotai/kimi-k2.6
```

### 2. Start Backend
```powershell
cd backend
python app.py
```
Backend runs on: `http://localhost:5000`

### 3. Start Frontend
```powershell
# From project root:
python -m http.server 8080 --directory frontend
# Visit: http://localhost:8080/login.html
```

### 4. Use the System
1. **Register / Login** on the login page
2. Enter a book title and/or summary → click **Analyze Book**
3. Or **upload** a `.txt`, `.md`, or `.pdf` file
4. Scroll down to **Books Explorer** to browse 100 books and click **Classify This** on any

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | System status |
| GET | `/health` | Health check |
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/classify` | Classify book by title/content |
| POST | `/upload-and-classify` | Upload file and classify |
| GET | `/books` | Get books dataset (filterable) |
| GET | `/books?genre=Fantasy` | Filter books by genre |
| GET | `/books?search=harry` | Search books |
| GET | `/books/genres` | List all available genres |

### POST /classify
```json
{
  "title": "Atomic Habits",
  "content": "A practical guide to building good habits..."
}
```

### GET /books
```json
{
  "success": true,
  "total": 100,
  "genres": ["Adventure", "Biography", ...],
  "books": [
    {
      "id": 1,
      "title": "Harry Potter and the Sorcerer's Stone",
      "author": "J.K. Rowling",
      "genre": "Fantasy",
      "year": 1997,
      "rating": 4.47,
      "description": "...",
      "pages": 309,
      "language": "English"
    }
  ]
}
```

---

## 📊 Books Dataset

| Stat | Value |
|------|-------|
| Total Books | 100 |
| Genres Covered | 30 |
| Source | Curated from Goodreads / public domain |
| File | `frontend/books_data.json` |

**Genres included:** Adventure, Autobiography, Biography, Business, Children's, Classic, Contemporary, Dystopian, Education, Fantasy, Fiction, Finance, Graphic Novel, Historical Fiction, Horror, Memoir, Mystery, Non-Fiction, Philosophy, Poetry, Psychology, Romance, Science, Science Fiction, Self-Help, Spirituality, Thriller, Travel, True Crime, Young Adult

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, Flask, SQLite |
| AI Model | Nvidia / Kimi K2.6 (OpenAI-compatible) |
| PDF Support | PyPDF2 |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Icons | Lucide Icons |
| Auth | SQLite + Werkzeug password hashing |
| Dataset | JSON (100 books, 30 genres) |

---

## 🔐 Security
- API keys stored in `.env` (never committed)
- Passwords hashed with Werkzeug (`pbkdf2:sha256`)
- CORS configured for local development
- Input validation on all endpoints
- File upload restricted to `.txt`, `.md`, `.pdf`

---

## 📈 Performance

| Operation | Time |
|-----------|------|
| Health Check | < 50ms |
| AI Classification | 5–10s (API dependent) |
| Books Explorer Load | < 100ms (local JSON) |
| `/books` API | < 50ms |

---

## 🧪 Running Tests
```powershell
python test_api.py
```

---

## ⚡ Start Everything (Two Terminals)

```powershell
# Terminal 1 — Backend
cd backend; python app.py

# Terminal 2 — Frontend
python -m http.server 8080 --directory frontend
# Open: http://localhost:8080/login.html
```

---

**Status**: ✅ Ready to use  
**Version**: 2.0 — with Books Explorer Dataset  
**Last Updated**: 2026-05-10
