from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from PyPDF2 import PdfReader
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)

OPENAI_API_KEY = os.getenv("api_key")
OPENAI_API_ENDPOINT = os.getenv(
    "api_endpoint", "https://integrate.api.nvidia.com/v1/chat/completions"
)
OPENAI_MODEL = os.getenv("model", "moonshotai/kimi-k2.6")


# API initialization time
INITIALIZED_AT = datetime.now().isoformat(timespec="seconds")


def _build_prompt(book_title: str, book_content: str) -> str:
    return f"""You are an expert book classifier and analyst. Analyze the following book content and provide comprehensive information:

Book Title: {book_title if book_title else "Not provided"}

Book Content/Summary:
{book_content}

Please provide a detailed analysis in JSON format with the following fields:
1. primary_category: The main category (e.g., Technology, Science, History, Business, Philosophy, Fiction, Self-Help)
2. secondary_categories: List of other relevant categories
3. themes: List of main themes identified in the content
4. subject_keywords: List of key subjects/topics covered
5. target_audience: Who would benefit from this book
6. difficulty_level: Beginner, Intermediate, Advanced, or Mixed
7. content_type: Academic, Practical Guide, Reference, Narrative, etc.
8. key_insights: 3-5 main insights or takeaways from the content
9. reading_time_estimate: Estimated reading time in hours
10. related_topics: Other books or topics this would relate to
11. summary: 2-3 sentence summary of the book
12. confidence_score: Your confidence in this classification (0-1)

Respond ONLY with valid JSON, no markdown or additional text."""


def _extract_message_content(response_payload: dict[str, Any]) -> str:
    choices = response_payload.get("choices") or []
    if not choices:
        raise ValueError("Missing choices in API response")

    message = choices[0].get("message") or {}
    content = message.get("content", "")

    # Some providers may return structured content blocks.
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(str(item.get("text", "")))
        content = "\n".join(text_parts)

    content_text = str(content).strip()
    if not content_text:
        raise ValueError("Empty model response content")

    if content_text.startswith("```"):
        lines = content_text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content_text = "\n".join(lines).strip()
        if content_text.lower().startswith("json"):
            content_text = content_text[4:].lstrip()

    return content_text


def _extract_api_error(response: requests.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            if payload.get("error"):
                return str(payload["error"])
            if payload.get("message"):
                return str(payload["message"])
    except Exception:
        pass

    text = response.text.strip()
    if text:
        return text[:500]
    return f"HTTP {response.status_code}"


def _parse_model_json(response_text: str) -> dict[str, Any]:
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    start = response_text.find("{")
    if start == -1:
        raise ValueError("Model response did not include JSON content")

    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(response_text)):
        char = response_text[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                candidate = response_text[start : index + 1]
                return json.loads(candidate)

    raise ValueError("Model response contained malformed JSON object")


def _classify_with_nvidia(book_title: str, book_content: str) -> dict[str, Any]:
    if not OPENAI_API_KEY:
        raise ValueError("Missing api_key in backend/.env")

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are a book classification expert that responds with valid JSON only.",
            },
            {"role": "user", "content": _build_prompt(book_title, book_content)},
        ],
        "max_tokens": 1500,
        "temperature": 0.7,
        "top_p": 1.0,
        "stream": False,
        "chat_template_kwargs": {"thinking": False},
    }

    response = requests.post(
        OPENAI_API_ENDPOINT,
        headers=headers,
        json=payload,
        timeout=90,
    )
    if not response.ok:
        raise RuntimeError(f"Upstream API error: {_extract_api_error(response)}")

    response_payload = response.json()
    response_text = _extract_message_content(response_payload)
    return _parse_model_json(response_text)


# ── SQLite thread-safe connection helper ──────────────────────────────────────
# Each thread gets its own connection object to avoid cross-thread sharing.
# WAL mode allows concurrent readers + 1 writer without "database is locked".
_local = threading.local()
DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')


def _get_conn() -> sqlite3.Connection:
    """Return a thread-local SQLite connection, creating it if needed."""
    conn = getattr(_local, 'conn', None)
    if conn is None:
        conn = sqlite3.connect(
            DB_PATH,
            timeout=30,                 # wait up to 30 s before raising OperationalError
            check_same_thread=False,    # we manage thread safety ourselves via _local
        )
        conn.row_factory = sqlite3.Row
        # WAL journal mode: readers don't block writers and vice-versa
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        _local.conn = conn
    return conn


@contextmanager
def get_db():
    """Context manager that yields a cursor and commits/rolls back automatically."""
    conn = _get_conn()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def init_db():
    with get_db() as c:
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        ''')


init_db()


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/", methods=["GET"])
def home() -> Any:
    return jsonify(
        {
            "project": "AI-Based Automated Book Classification System",
            "status": "running",
            "model": OPENAI_MODEL,
            "api": "OpenAI-compatible (Nvidia)",
            "endpoints": {
                "health": "/health",
                "classify": "/classify",
                "upload": "/upload-and-classify"
            },
            "description": "Upload book content or text to classify books with AI-powered analysis"
        }
    )


@app.route("/register", methods=["POST", "OPTIONS"])
def register() -> Any:
    if request.method == "OPTIONS":
        return ("", 204)
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "user")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    hashed_password = generate_password_hash(password)

    try:
        with get_db() as c:
            c.execute(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                (username, hashed_password, role)
            )
        return jsonify({"success": True, "message": "Registered successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/login", methods=["POST", "OPTIONS"])
def login() -> Any:
    if request.method == "OPTIONS":
        return ("", 204)
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    try:
        with get_db() as c:
            c.execute('SELECT password, role FROM users WHERE username = ?', (username,))
            user = c.fetchone()
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    if user and check_password_hash(user[0], password):
        return jsonify({
            "success": True,
            "username": username,
            "role": user[1]
        })
    return jsonify({"error": "Invalid username or password"}), 401


@app.route("/health", methods=["GET"])
def health() -> Any:
    return jsonify(
        {
            "status": "healthy",
            "initialized_at": INITIALIZED_AT,
            "model": OPENAI_MODEL,
            "api": "OpenAI-compatible",
            "endpoint": OPENAI_API_ENDPOINT
        }
    )



@app.route("/classify", methods=["POST", "OPTIONS"])
def classify_with_ai() -> Any:
    """Classify book content using OpenAI-compatible API"""
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        payload = request.get_json(silent=True) or {}
        
        # Accept either raw text or file content
        book_content = str(payload.get("content", "")).strip()
        book_title = str(payload.get("title", "")).strip()
        
        if not book_content and not book_title:
            return jsonify({"error": "Either book title or book content is required"}), 400
            
        if not book_content and book_title:
            book_content = f"Please classify this book based entirely on its title: '{book_title}'"
        
        # Limit content to first 3000 characters for massive API speedup
        book_content = book_content[:3000]
        
        try:
            classification_result = _classify_with_nvidia(book_title, book_content)
            return jsonify({
                "success": True,
                "classification": classification_result,
                "model": OPENAI_MODEL,
                "api": "OpenAI-compatible",
                "timestamp": datetime.now().isoformat(timespec="seconds")
            })
            
        except Exception as api_error:
            return jsonify({
                "error": f"API error: {str(api_error)}",
                "type": "api_error"
            }), 500
            
    except Exception as e:
        return jsonify({
            "error": f"Server error: {str(e)}",
            "type": "server_error"
        }), 500


@app.route("/upload-and-classify", methods=["POST", "OPTIONS"])
def upload_and_classify() -> Any:
    """Upload a text file and classify the book content"""
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        # Check if file was provided
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        book_title = request.form.get("title", "").strip()
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        # Read file content
        if file.filename.endswith((".txt", ".md", ".pdf")):
            try:
                if file.filename.endswith(".pdf"):
                    # Extract text from PDF
                    try:
                        pdf_reader = PdfReader(file.stream)
                        file_content = ""
                        for page in pdf_reader.pages:
                            file_content += page.extract_text() + "\n"
                            if len(file_content) > 10000:
                                break
                        file_content = file_content.strip()
                    except Exception as pdf_error:
                        return jsonify({
                            "error": f"Failed to read PDF: {str(pdf_error)}. Make sure it's a valid PDF file."
                        }), 400
                else:
                    file_content = file.read().decode("utf-8", errors="ignore").strip()
            except Exception as e:
                return jsonify({"error": f"Failed to read file: {str(e)}"}), 400
        else:
            return jsonify({
                "error": "Unsupported file type. Please use .txt, .md, or .pdf files"
            }), 400
        
        if not file_content:
            return jsonify({"error": "File is empty"}), 400
        
        # Use the classify endpoint logic
        book_content = file_content[:3000]
        
        try:
            classification_result = _classify_with_nvidia(
                book_title if book_title else file.filename,
                book_content,
            )
            return jsonify({
                "success": True,
                "filename": file.filename,
                "classification": classification_result,
                "model": OPENAI_MODEL,
                "api": "OpenAI-compatible",
                "timestamp": datetime.now().isoformat(timespec="seconds")
            })
        except Exception as api_error:
            return jsonify({
                "error": f"API error: {str(api_error)}",
                "type": "api_error"
            }), 500
        
    except Exception as e:
        return jsonify({
            "error": f"Server error: {str(e)}",
            "type": "server_error"
        }), 500


BOOKS_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'books_data.json')

@app.route("/books", methods=["GET"])
def get_books() -> Any:
    """Return books dataset with optional genre/search filtering."""
    try:
        with open(BOOKS_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        books = data.get('books', [])
        genre = request.args.get('genre', '').strip()
        search = request.args.get('search', '').strip().lower()
        if genre:
            books = [b for b in books if b.get('genre', '').lower() == genre.lower()]
        if search:
            books = [b for b in books if search in b.get('title', '').lower()
                     or search in b.get('author', '').lower()
                     or search in b.get('description', '').lower()]
        return jsonify({"success": True, "books": books, "total": len(books),
                        "genres": data.get('genres', [])})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/books/genres", methods=["GET"])
def get_genres() -> Any:
    """Return list of all available genres."""
    try:
        with open(BOOKS_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify({"success": True, "genres": data.get('genres', [])})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":

    # threaded=True is Flask's default; use_reloader=False avoids the
    # double-process issue that can cause SQLite locking in debug mode.
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True, use_reloader=False)
