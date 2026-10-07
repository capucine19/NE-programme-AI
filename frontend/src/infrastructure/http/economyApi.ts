import type { DebtData, SpendingData } from "@domain/economy";
import type { EconomyRepository } from "@domain/ports";
import { httpJson } from "./apiClient";

type Series = (number | null)[];

interface DebtDto {
  source: string;
  dataset: string;
  source_url: string;
  definition: string;
  eurostat_updated: string | null;
  fetched_at: string;
  quarters: string[];
  france: { eur_millions: Series; pct_gdp: Series };
  compare_pct_gdp: Record<string, Series>;
}

interface SpendingDto {
  source: string;
  source_urls: { main: string; cofog: string };
  eurostat_updated: string | null;
  years: string[];
  total_eur_m: Series;
  total_pct_gdp: Series;
  social_cash_eur_m: Series;
  social_inkind_eur_m: Series;
  compare_pct_gdp: Record<string, Series>;
  eu_compare: {
    years: string[];
    eu27: Series;
    countries: { code: string; label: string; pct_gdp: Series }[];
  };
  cofog: {
    years: string[];
    total_eur_m: Series;
    old_age_eur_m: Series;
    functions: { code: string; label: string; eur_m: Series }[];
  };
}

export class HttpEconomyRepository implements EconomyRepository {
  async getDebt(): Promise<DebtData> {
    const dto = await httpJson<DebtDto>("/api/economie/dette");
    return {
      source: dto.source,
      dataset: dto.dataset,
      sourceUrl: dto.source_url,
      definition: dto.definition,
      eurostatUpdated: dto.eurostat_updated,
      fetchedAt: dto.fetched_at,
      quarters: dto.quarters,
      france: {
        eurMillions: dto.france.eur_millions,
        pctGdp: dto.france.pct_gdp,
      },
      comparePctGdp: dto.compare_pct_gdp,
    };
  }

  async getSpending(): Promise<SpendingData> {
    const dto = await httpJson<SpendingDto>("/api/economie/depenses");
    return {
      source: dto.source,
      sourceUrls: dto.source_urls,
      eurostatUpdated: dto.eurostat_updated,
      years: dto.years,
      totalEurMillions: dto.total_eur_m,
      totalPctGdp: dto.total_pct_gdp,
      socialCashEurMillions: dto.social_cash_eur_m,
      socialInKindEurMillions: dto.social_inkind_eur_m,
      comparePctGdp: dto.compare_pct_gdp,
      euCompare: {
        years: dto.eu_compare.years,
        eu27: dto.eu_compare.eu27,
        countries: dto.eu_compare.countries.map((c) => ({
          code: c.code,
          label: c.label,
          pctGdp: c.pct_gdp,
        })),
      },
      cofog: {
        years: dto.cofog.years,
        totalEurMillions: dto.cofog.total_eur_m,
        oldAgeEurMillions: dto.cofog.old_age_eur_m,
        functions: dto.cofog.functions.map((f) => ({
          code: f.code,
          label: f.label,
          eurMillions: f.eur_m,
        })),
      },
    };
  }
}
