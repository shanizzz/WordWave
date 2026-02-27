import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Dictionary API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en"


@app.get("/")
async def root():
    return {"message": "Dictionary API", "docs": "/docs"}


@app.get("/api/word/{word}")
async def get_definition(word: str):
    if not word.strip():
        raise HTTPException(status_code=400, detail="Word is required")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(f"{DICTIONARY_API}/{word.strip().lower()}")
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail="Word not found")
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(status_code=404, detail="Word not found")
            raise HTTPException(status_code=e.response.status_code, detail="Dictionary API error")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach dictionary service: {str(e)}")
