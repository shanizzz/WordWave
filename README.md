# WordWave – Dictionary App

WordWave is a small full‑stack dictionary application built with **Python** (backend) and **JavaScript/React** (frontend). It retrieves word data from the free [Dictionary API](https://dictionaryapi.dev/).

## Stack

- **Backend:** Python, FastAPI  
- **Frontend:** JavaScript (React), HTML, CSS  

## Running locally

### Backend

```bash
cd dictionary-app/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at http://localhost:8000

### Frontend

```bash
cd dictionary-app/client
npm install
npm run dev
```

Frontend runs at http://localhost:5173. Use the search box to look up words.

## API endpoint

- `GET /api/word/{word}` — returns definitions for the given word (proxies Free Dictionary API).
