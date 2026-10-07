"""Télécharge les données économiques depuis Eurostat (sans clé API).

Jeux de données :
  - gov_10q_ggdebt : dette brute des APU, trimestrielle (définition de Maastricht)
  - gov_10a_main   : dépenses totales et prestations sociales des APU, annuelles
  - gov_10a_exp    : dépenses par fonction (COFOG), annuelles

Écrit data/economie.json, lu par l'API (/api/economie/dette et /depenses).

Usage :
  python scripts/fetch_eurostat.py
"""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "data" / "economie.json"

BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
BROWSER = "https://ec.europa.eu/eurostat/databrowser/view/{}/default/table"
GEOS = ["FR", "DE", "IT", "ES", "EA20"]
EU27 = [
    "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV",
    "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE",
]

# Fonctions COFOG : code -> libellé court. Les retraites sont GF1002 (« vieillesse »),
# sous-ensemble de la protection sociale GF10.
COFOG = {
    "GF10": "Protection sociale",
    "GF07": "Santé",
    "GF09": "Enseignement",
    "GF01": "Services généraux (dont intérêts de la dette)",
    "GF04": "Affaires économiques",
    "GF03": "Ordre et sécurité publics",
    "GF02": "Défense",
    "GF08": "Loisirs, culture et culte",
    "GF06": "Logement et équipements collectifs",
    "GF05": "Environnement",
}
COFOG_OLD_AGE = "GF1002"


def fetch_json(dataset: str, params: list[tuple[str, str]]) -> dict:
    query = "&".join(f"{k}={v}" for k, v in [("format", "JSON"), ("lang", "FR"), *params])
    req = urllib.request.Request(
        f"{BASE}/{dataset}?{query}", headers={"User-Agent": "programme-lisnard/0.4"}
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def times_of(data: dict) -> list[str]:
    index = data["dimension"]["time"]["category"]["index"]
    return [t for t, _ in sorted(index.items(), key=lambda kv: kv[1])]


def series(data: dict, fixed: dict[str, str], times: list[str]) -> list[float | None]:
    """Extrait une série du format JSON-stat (tableau aplati, ordre des dimensions `id`).

    `fixed` donne la valeur des dimensions à sélectionner ; les autres sont de taille 1.
    """
    ids, sizes = data["id"], data["size"]
    values = data["value"]
    out: list[float | None] = []
    for t in times:
        pos = {**fixed, "time": t}
        offset, stride = 0, 1
        for dim, size in zip(reversed(ids), reversed(sizes)):
            index = data["dimension"][dim]["category"]["index"]
            offset += (index[pos[dim]] if dim in pos else 0) * stride
            stride *= size
        v = values.get(str(offset))
        out.append(float(v) if v is not None else None)
    return out


def end_index(values: list[float | None]) -> int:
    """Index (exclu) juste après la dernière période disposant d'une valeur."""
    return max(i for i, v in enumerate(values) if v is not None) + 1


def fetch_debt() -> dict:
    data = fetch_json(
        "gov_10q_ggdebt",
        [("sector", "S13"), ("na_item", "GD")]
        + [("geo", g) for g in GEOS]
        + [("unit", "MIO_EUR"), ("unit", "PC_GDP")],
    )
    times = times_of(data)
    fr_eur = series(data, {"unit": "MIO_EUR", "geo": "FR"}, times)
    fr_pct = series(data, {"unit": "PC_GDP", "geo": "FR"}, times)
    compare = {g: series(data, {"unit": "PC_GDP", "geo": g}, times) for g in GEOS}
    end = end_index(fr_eur)
    print(f"Dette : {times[0]} -> {times[end - 1]}, {fr_eur[end - 1]:,.0f} M EUR")
    return {
        "source": "Eurostat",
        "dataset": "gov_10q_ggdebt",
        "source_url": BROWSER.format("gov_10q_ggdebt"),
        "definition": "Dette brute des administrations publiques (définition de Maastricht)",
        "eurostat_updated": data.get("updated"),
        "quarters": times[:end],
        "france": {"eur_millions": fr_eur[:end], "pct_gdp": fr_pct[:end]},
        "compare_pct_gdp": {g: v[:end] for g, v in compare.items()},
    }


def fetch_spending() -> dict:
    main = fetch_json(
        "gov_10a_main",
        [("sector", "S13"), ("na_item", "TE"), ("na_item", "D62PAY"), ("na_item", "D632PAY")]
        + [("geo", g) for g in GEOS]
        + [("unit", "MIO_EUR"), ("unit", "PC_GDP")],
    )
    years = times_of(main)

    def fr(na_item: str, unit: str = "MIO_EUR") -> list[float | None]:
        return series(main, {"na_item": na_item, "unit": unit, "geo": "FR"}, years)

    total = fr("TE")
    end = end_index(total)
    compare = {
        g: series(main, {"na_item": "TE", "unit": "PC_GDP", "geo": g}, years)[:end] for g in GEOS
    }

    eu = fetch_json(
        "gov_10a_main",
        [("sector", "S13"), ("na_item", "TE"), ("unit", "PC_GDP")]
        + [("geo", g) for g in EU27 + ["EU27_2020"]],
    )
    eu_years = times_of(eu)
    eu_labels = eu["dimension"]["geo"]["category"]["label"]
    eu_series = {
        g: series(eu, {"geo": g}, eu_years) for g in EU27 + ["EU27_2020"]
    }
    eu_end = end_index(eu_series["FR"])

    cofog_codes = list(COFOG) + [COFOG_OLD_AGE, "TOTAL"]
    exp = fetch_json(
        "gov_10a_exp",
        [("geo", "FR"), ("sector", "S13"), ("unit", "MIO_EUR"), ("na_item", "TE")]
        + [("cofog99", c) for c in cofog_codes],
    )
    cofog_years = times_of(exp)
    cofog_series = {c: series(exp, {"cofog99": c}, cofog_years) for c in cofog_codes}
    cend = end_index(cofog_series["TOTAL"])

    print(f"Depenses : {years[0]} -> {years[end - 1]}, {total[end - 1]:,.0f} M EUR ; "
          f"COFOG jusqu'en {cofog_years[cend - 1]}")
    return {
        "source": "Eurostat",
        "datasets": {"main": "gov_10a_main", "cofog": "gov_10a_exp"},
        "source_urls": {
            "main": BROWSER.format("gov_10a_main"),
            "cofog": BROWSER.format("gov_10a_exp"),
        },
        "eurostat_updated": main.get("updated"),
        "years": years[:end],
        "total_eur_m": total[:end],
        "total_pct_gdp": fr("TE", "PC_GDP")[:end],
        "social_cash_eur_m": fr("D62PAY")[:end],
        "social_inkind_eur_m": fr("D632PAY")[:end],
        "compare_pct_gdp": compare,
        "eu_compare": {
            "years": eu_years[:eu_end],
            "eu27": eu_series["EU27_2020"][:eu_end],
            "countries": [
                {"code": g, "label": eu_labels[g], "pct_gdp": eu_series[g][:eu_end]}
                for g in EU27
            ],
        },
        "cofog": {
            "years": cofog_years[:cend],
            "total_eur_m": cofog_series["TOTAL"][:cend],
            "old_age_eur_m": cofog_series[COFOG_OLD_AGE][:cend],
            "functions": [
                {"code": c, "label": label, "eur_m": cofog_series[c][:cend]}
                for c, label in COFOG.items()
            ],
        },
    }


def main() -> None:
    print("Telechargement Eurostat...")
    result = fetch_debt()
    result["fetched_at"] = datetime.now(timezone.utc).isoformat()
    result["depenses"] = fetch_spending()
    OUT_PATH.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"OK -> {OUT_PATH}")


if __name__ == "__main__":
    main()
