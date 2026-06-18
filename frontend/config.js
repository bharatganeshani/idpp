/**
 * config.js — single source of truth for the backend API URL.
 *
 * LOCAL DEV:  Leave BACKEND_URL as http://127.0.0.1:5000
 * PRODUCTION: Change BACKEND_URL to your Render service URL before deploying
 *             to Netlify, e.g. https://nexus-ai-backend.onrender.com
 *
 * This file is intentionally plain JS (not a .env) so it works with a
 * static HTML/JS frontend that has no build step.
 */

// ── Change this ONE line when you deploy ──────────────────────────────────────
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000'          // local dev
  : 'https://nexus-ai-backend.onrender.com';  // ← replace with your Render URL
// ─────────────────────────────────────────────────────────────────────────────
