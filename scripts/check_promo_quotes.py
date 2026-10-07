"""Vérifie que chaque citation de frontend/src/domain/chartPromo.ts figure mot pour mot
dans le corpus du site officiel (data/programme.json), à la page indiquée.

Une citation peut contenir « […] » : chaque morceau doit alors apparaître tel quel.
Sortie non nulle si une citation est introuvable ou ne correspond pas à son URL.

Usage :
  python scripts/check_promo_quotes.py
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = ROOT / "frontend" / "src" / "domain" / "chartPromo.ts"
CORPUS = ROOT / "data" / "programme.json"


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFC", text).replace(" ", " ")
    text = re.sub(r"\s+", " ", text)
    # Le site met parfois une espace avant la virgule ou le point : « PIB , et »
    return re.sub(r"\s+([,.;])", r"\1", text).strip()


def main() -> int:
    source = TS.read_text(encoding="utf-8")
    entries = re.findall(
        r'quote:\s*"(?P<quote>[^"]+)",.*?sourceUrl:\s*(?P<url>`[^`]+`|"[^"]+")',
        source,
        re.S,
    )
    # Les URL du programme sont construites avec `${PROGRAMME}` ; on les reconstitue
    base = re.search(r'const PROGRAMME = "([^"]+)"', source).group(1)
    chunks = json.loads(CORPUS.read_text(encoding="utf-8"))["chunks"]

    failures = 0
    for quote, raw_url in entries:
        url = raw_url.strip('`"').replace("${PROGRAMME}", base)
        pages = [normalize(c["text"]) for c in chunks if c["url"] == url]
        parts = [normalize(p) for p in quote.split("[…]")]
        ok = bool(pages) and all(any(part in page for page in pages) for part in parts)
        failures += not ok
        print(("OK      " if ok else "ABSENTE ") + quote[:90] + ("…" if len(quote) > 90 else ""))
        if not ok:
            print(f"         page : {url} ({len(pages)} passages)")
    print(f"\n{len(entries) - failures}/{len(entries)} citations vérifiées")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
