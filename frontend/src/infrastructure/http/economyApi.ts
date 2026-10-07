import type { DebtData, EuRanking, RatesData, SpendingData } from "@domain/economy";
import type { EconomyRepository } from "@domain/ports";
import { httpJson } from "./apiClient";

type Series = (number | null)[];

interface EuRankingDto {
  years: string[];
  eu27: Series;
  countries: { code: string; label: string; pct_gdp: Series }[];
}

interface RatesDto {
  source: string;
  dataset: string;
  source_url: string;
  definition: string;
  eurostat_updated: string | null;
  months: string[];
  france: Series;
  compare: Record<string, Series>;
}

function mapEuRanking(dto: EuRankingDto): EuRanking {
  return {
    years: dto.years,
    eu27: dto.eu27,
    countries: dto.countries.map((c) => ({ code: c.code, label: c.label, pctGdp: c.pct_gdp })),
  };
}

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
  population: { years: string[]; values: Series };
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
  interest_eur_m: Series;
  interest_pct_gdp: Series;
  balance_eur_m: Series;
  balance_pct_gdp: Series;
  revenue_pct_gdp: Series;
  tax_production_pct_gdp: Series;
  tax_income_pct_gdp: Series;
  social_contrib_pct_gdp: Series;
  eu_compare: EuRankingDto;
  eu_deficit: EuRankingDto;
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
      population: dto.population,
    };
  }

  async getRates(): Promise<RatesData> {
    const dto = await httpJson<RatesDto>("/api/economie/taux");
    return {
      source: dto.source,
      dataset: dto.dataset,
      sourceUrl: dto.source_url,
      definition: dto.definition,
      eurostatUpdated: dto.eurostat_updated,
      months: dto.months,
      france: dto.france,
      compare: dto.compare,
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
      interestEurMillions: dto.interest_eur_m,
      interestPctGdp: dto.interest_pct_gdp,
      balanceEurMillions: dto.balance_eur_m,
      balancePctGdp: dto.balance_pct_gdp,
      revenuePctGdp: dto.revenue_pct_gdp,
      taxProductionPctGdp: dto.tax_production_pct_gdp,
      taxIncomePctGdp: dto.tax_income_pct_gdp,
      socialContribPctGdp: dto.social_contrib_pct_gdp,
      euCompare: mapEuRanking(dto.eu_compare),
      euDeficit: mapEuRanking(dto.eu_deficit),
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
