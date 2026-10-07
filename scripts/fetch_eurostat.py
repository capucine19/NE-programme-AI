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

# Postes de gov_10a_main : dépenses totales, prestations sociales (espèces / nature), intérêts de
# la dette, solde (B9), recettes totales, impôts sur la production et les importations, impôts
# courants sur le revenu et le patrimoine, cotisations sociales.
MAIN_ITEMS = ["TE", "D62PAY", "D632PAY", "D41PAY", "B9", "TR", "D2REC", "D5REC", "D61REC"]


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

    # Population au 1er janvier : sert à la dette par habitant
    pop = fetch_json(
        "demo_pjan", [("geo", "FR"), ("sex", "T"), ("age", "TOTAL"), ("unit", "NR")]
    )
    pop_years = times_of(pop)
    pop_values = series(pop, {}, pop_years)
    pend = end_index(pop_values)
    print(f"Population : {pop_years[pend - 1]} = {pop_values[pend - 1]:,.0f}")
    return {
        "source": "Eurostat",
        "dataset": "gov_10q_ggdebt",
        "source_url": BROWSER.format("gov_10q_ggdebt"),
        "definition": "Dette brute des administrations publiques (définition de Maastricht)",
        "eurostat_updated": data.get("updated"),
        "quarters": times[:end],
        "france": {"eur_millions": fr_eur[:end], "pct_gdp": fr_pct[:end]},
        "compare_pct_gdp": {g: v[:end] for g, v in compare.items()},
        "population": {"years": pop_years[:pend], "values": pop_values[:pend]},
    }


def fetch_rates() -> dict:
    """Taux des obligations d'État à 10 ans (moyennes mensuelles) : OAT pour la France."""
    geos = ["FR", "DE", "IT", "ES"]
    data = fetch_json(
        "irt_lt_mcby_m", [("int_rt", "MCBY")] + [("geo", g) for g in geos]
    )
    months = times_of(data)
    by_geo = {g: series(data, {"geo": g}, months) for g in geos}
    end = end_index(by_geo["FR"])
    print(f"Taux 10 ans : {months[0]} -> {months[end - 1]}, FR {by_geo['FR'][end - 1]} %")
    return {
        "source": "Eurostat",
        "dataset": "irt_lt_mcby_m",
        "source_url": BROWSER.format("irt_lt_mcby_m"),
        "definition": "Rendement des obligations d'État à 10 ans (taux dit de convergence), "
        "moyenne mensuelle",
        "eurostat_updated": data.get("updated"),
        "months": months[:end],
        "france": by_geo["FR"][:end],
        "compare": {g: v[:end] for g, v in by_geo.items() if g != "FR"},
    }


def fetch_eu_pct_gdp(na_item: str) -> dict:
    """Un poste de gov_10a_main en % du PIB pour les pays de l'UE27 et la moyenne UE27."""
    codes = EU27 + ["EU27_2020"]
    data = fetch_json(
        "gov_10a_main",
        [("sector", "S13"), ("na_item", na_item), ("unit", "PC_GDP")]
        + [("geo", g) for g in codes],
    )
    years = times_of(data)
    labels = data["dimension"]["geo"]["category"]["label"]
    values = {g: series(data, {"geo": g}, years) for g in codes}
    end = end_index(values["FR"])
    return {
        "years": years[:end],
        "eu27": values["EU27_2020"][:end],
        "countries": [
            {"code": g, "label": labels[g], "pct_gdp": values[g][:end]} for g in EU27
        ],
    }


def fetch_spending() -> dict:
    main = fetch_json(
        "gov_10a_main",
        [("sector", "S13")]
        + [("na_item", i) for i in MAIN_ITEMS]
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

    eu_spending = fetch_eu_pct_gdp("TE")
    eu_deficit = fetch_eu_pct_gdp("B9")
    eu_years = eu_spending["years"]

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
        "interest_eur_m": fr("D41PAY")[:end],
        "interest_pct_gdp": fr("D41PAY", "PC_GDP")[:end],
        "balance_eur_m": fr("B9")[:end],
        "balance_pct_gdp": fr("B9", "PC_GDP")[:end],
        "revenue_pct_gdp": fr("TR", "PC_GDP")[:end],
        "tax_production_pct_gdp": fr("D2REC", "PC_GDP")[:end],
        "tax_income_pct_gdp": fr("D5REC", "PC_GDP")[:end],
        "social_contrib_pct_gdp": fr("D61REC", "PC_GDP")[:end],
        "compare_pct_gdp": compare,
        "eu_compare": eu_spending,
        "eu_deficit": eu_deficit,
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
    result["taux"] = fetch_rates()
    OUT_PATH.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"OK -> {OUT_PATH}")


if __name__ == "__main__":
    main()
