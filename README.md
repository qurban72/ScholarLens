# ScholarLens

AI-powered scholarship and admission assistant. Admins upload PDFs; students ask questions and get answers grounded in those documents, with citations (document name and page number).

## Architecture

React (Vite + Tailwind) → FastAPI → PyMuPDF (text) → Sentence Transformers (embeddings) → Pinecone (vectors) → Gemini (answer from retrieved passages only).

## 1. Pinecone setup

Create a serverless index with:
- Dimension: **384** (matches `all-MiniLM-L6-v2`)
- Metric: **cosine**
- Name: same as `PINECONE_INDEX` (default `scholarlens`)

## 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env                          # then fill in your keys
cd .. && uvicorn app.main:app --app-dir backend --reload
```

API docs: http://localhost:8000/docs

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

## Docker

```bash
docker compose up --build
```

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /api/documents/upload | Upload and index a PDF |
| GET | /api/documents | List documents and status |
| DELETE | /api/documents/{document_id} | Delete a document and its vectors |
| POST | /api/chat | Ask a question, get a grounded answer and sources |
| GET | /api/chat/history?session_id= | Chat history for a session |
| GET | /api/health | Health check |

## Known MVP limits

- No authentication yet. Protect the admin endpoints before any public deployment.
- Scanned (image-only) PDFs are rejected; OCR is not included.
- Document metadata is stored in a JSON file (`data/documents.json`). Use PostgreSQL for production.
- Chat history is kept in memory and resets when the server restarts.
- Roman Urdu and voice features are not part of this MVP.

## Verify before the event

Gemini free-tier limits and data-use terms can change. Check them, and do not upload confidential documents to a free API without reviewing those terms.
