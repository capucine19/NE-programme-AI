"""Barrières de consommation Mistral : limites par IP + plafond global journalier.

Compteurs en mémoire : valables pour une instance unique (remis à zéro au redémarrage).
"""

from __future__ import annotations

import os
import threading
import time
from collections import deque
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, Request

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


CHAT_PER_MINUTE = _env_int("LIMIT_CHAT_PER_MINUTE", 5)
CHAT_PER_DAY = _env_int("LIMIT_CHAT_PER_DAY", 50)
SEARCH_PER_MINUTE = _env_int("LIMIT_SEARCH_PER_MINUTE", 30)
CHAT_GLOBAL_PER_DAY = _env_int("LIMIT_CHAT_GLOBAL_PER_DAY", 1000)
CHAT_MAX_TOKENS = _env_int("CHAT_MAX_TOKENS", 1200)

_lock = threading.Lock()
_hits: dict[tuple[str, str, int], deque[float]] = {}
_global_day = date.today()
_global_chat_count = 0


def client_ip(request: Request) -> str:
    # Derrière le proxy Railway : l'IP ajoutée par le proxy est la dernière
    # de X-Forwarded-For (les précédentes peuvent être forgées par le client).
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "inconnu"


def _window(ip: str, bucket: str, window: int, now: float) -> deque[float]:
    hits = _hits.setdefault((ip, bucket, window), deque())
    while hits and hits[0] <= now - window:
        hits.popleft()
    return hits


def _too_many(message: str) -> HTTPException:
    return HTTPException(status_code=429, detail=message)


def check_search(request: Request) -> None:
    now = time.monotonic()
    with _lock:
        minute = _window(client_ip(request), "search", 60, now)
        if len(minute) >= SEARCH_PER_MINUTE:
            raise _too_many("Trop de recherches en peu de temps. Réessayez dans une minute.")
        minute.append(now)


def check_chat(request: Request) -> None:
    global _global_day, _global_chat_count
    ip = client_ip(request)
    now = time.monotonic()
    with _lock:
        today = date.today()
        if today != _global_day:
            _global_day, _global_chat_count = today, 0
        if _global_chat_count >= CHAT_GLOBAL_PER_DAY:
            raise _too_many(
                "Le service a atteint son quota de questions pour aujourd'hui. "
                "Le mode « Chercher » reste disponible."
            )
        minute = _window(ip, "chat", 60, now)
        day = _window(ip, "chat", 86400, now)
        if len(minute) >= CHAT_PER_MINUTE:
            raise _too_many("Trop de questions en peu de temps. Réessayez dans une minute.")
        if len(day) >= CHAT_PER_DAY:
            raise _too_many(
                "Vous avez atteint la limite de questions pour aujourd'hui. "
                "Le mode « Chercher » reste disponible."
            )
        minute.append(now)
        day.append(now)
        _global_chat_count += 1
