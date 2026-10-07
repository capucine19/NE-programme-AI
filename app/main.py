"""API + UI pour interroger le programme Lisnard via Mistral (RAG sourcé)."""

from __future__ import annotations

import hashlib
import json
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from mistralai.client import Mistral
from pydantic import BaseModel, Field

from app.limits import CHAT_MAX_TOKENS, check_chat, check_search
from app.prompts import SYSTEM_PROMPT, build_user_prompt
from app.retrieve import embeddings_status, load_corpus, search

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env", override=True)

DIST_DIR = ROOT / "frontend" / "dist"
ECONOMIE_PATH = ROOT / "data" / "economie.json"

app = FastAPI(title="Programme Lisnard — questions sourcées", version="0.3.0")


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


class SourceOut(BaseModel):
    page_title: str
    section: str
    paragraph: int
    url: str
    score: float
    excerpt: str
    score_lexical: float | None = None
    score_semantic: float | None = None
    retrieval: str | None = None
    short_path: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceOut]
    model: str
    found: bool
    retrieval: str | None = None


class SearchResponse(BaseModel):
    results: list[SourceOut]
    retrieval: str
    count: int


def mistral_client() -> Mistral:
    key = os.getenv("MISTRAL_API_KEY", "").strip()
    if not key or key.startswith("your_"):
        raise HTTPException(
            status_code=503,
            detail="MISTRAL_API_KEY manquante. Copiez .env.example vers .env et renseignez la clé.",
        )
    return Mistral(api_key=key)


def _has_api_key() -> bool:
    key = os.getenv("MISTRAL_API_KEY", "").strip()
    return bool(key) and not key.startswith("your_")


def short_code(url: str) -> str:
    """Code court stable d'une page source (sans stockage : dérivé de l'URL)."""
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:6]


@lru_cache(maxsize=1)
def short_links() -> dict[str, str]:
    links: dict[str, str] = {}
    for chunk in load_corpus()["chunks"]:
        links.setdefault(short_code(chunk["url"]), chunk["url"])
    return links


def to_sources(chunks: list[dict]) -> list[SourceOut]:
    return [
        SourceOut(
            page_title=c["page_title"],
            section=c["section"],
            paragraph=c["paragraph"],
            url=c["url"],
            score=c["score"],
            excerpt=c["text"][:280] + ("…" if len(c["text"]) > 280 else ""),
            score_lexical=c.get("score_lexical"),
            score_semantic=c.get("score_semantic"),
            retrieval=c.get("retrieval"),
            short_path=f"/s/{short_code(c['url'])}",
        )
        for c in chunks
    ]


@app.get("/api/health")
def health() -> dict:
    try:
        corpus = load_corpus()
        emb = embeddings_status()
        return {
            "ok": True,
            "chunks": corpus.get("chunk_count"),
            "pages": corpus.get("page_count"),
            "scraped_at": corpus.get("scraped_at"),
            "model": os.getenv("MISTRAL_MODEL", "mistral-small-latest"),
            "embed_model": os.getenv("MISTRAL_EMBED_MODEL", "mistral-embed"),
            "has_api_key": _has_api_key(),
            "embeddings": emb,
        }
    except FileNotFoundError as exc:
        return {"ok": False, "error": str(exc)}


@app.post("/api/search", response_model=SearchResponse)
def api_search(body: QueryRequest, request: Request) -> SearchResponse:
    """Recherche dans le programme (sans LLM) — lexical + embeddings si dispo."""
    check_search(request)
    chunks = search(body.question.strip(), top_k=12)
    retrieval = chunks[0]["retrieval"] if chunks else (
        "hybrid" if embeddings_status()["ready"] and _has_api_key() else "lexical"
    )
    return SearchResponse(results=to_sources(chunks), retrieval=retrieval, count=len(chunks))


@app.post("/api/chat", response_model=ChatResponse)
def chat(body: QueryRequest, request: Request) -> ChatResponse:
    check_chat(request)
    question = body.question.strip()
    chunks = search(question, top_k=8)
    model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
    sources = to_sources(chunks)
    retrieval = chunks[0]["retrieval"] if chunks else None

    if not chunks:
        return ChatResponse(
            answer="Aucune réponse trouvée dans le programme officiel.",
            sources=[],
            model=model,
            found=False,
            retrieval=retrieval,
        )

    client = mistral_client()
    try:
        completion = client.chat.complete(
            model=model,
            temperature=0.1,
            max_tokens=CHAT_MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(question, chunks)},
            ],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Erreur Mistral : {exc}") from exc

    answer = (completion.choices[0].message.content or "").strip()
    found = "aucune réponse trouvée" not in answer.lower()
    return ChatResponse(
        answer=answer,
        sources=sources,
        model=model,
        found=found,
        retrieval=retrieval,
    )


def _load_economie() -> dict:
    """Données Eurostat pré-téléchargées par scripts/fetch_eurostat.py."""
    if not ECONOMIE_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Données économiques absentes. Lancez `python scripts/fetch_eurostat.py`.",
        )
    return json.loads(ECONOMIE_PATH.read_text(encoding="utf-8"))


@app.get("/api/economie/dette")
def economie_dette() -> dict:
    data = _load_economie()
    data.pop("depenses", None)
    return data


@app.get("/api/economie/depenses")
def economie_depenses() -> dict:
    spending = _load_economie().get("depenses")
    if spending is None:
        raise HTTPException(
            status_code=503,
            detail="Données de dépenses absentes. Relancez `python scripts/fetch_eurostat.py`.",
        )
    return spending


@app.get("/s/{code}")
def short_link(code: str) -> RedirectResponse:
    """Lien court affiché sur les visuels partagés → page source officielle."""
    url = short_links().get(code)
    if not url:
        raise HTTPException(status_code=404, detail="Lien inconnu.")
    return RedirectResponse(url, status_code=302)


# --- Front : build Vue (frontend/dist) ---
if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")


@app.get("/")
def index() -> FileResponse:
    vue_index = DIST_DIR / "index.html"
    if vue_index.exists():
        return FileResponse(vue_index)
    raise HTTPException(
        status_code=503,
        detail="Front introuvable. Lancez `cd frontend && npm run build`.",
    )


@app.get("/{filename}")
def public_file(filename: str) -> FileResponse:
    """Fichiers de frontend/public copiés à la racine du build (favicons…)."""
    path = (DIST_DIR / filename).resolve()
    if path.parent != DIST_DIR.resolve() or not path.is_file():
        raise HTTPException(status_code=404, detail="Introuvable.")
    return FileResponse(path)
