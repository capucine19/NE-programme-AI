/** Données économiques (Eurostat) et calculs associés — sans dépendance UI / HTTP. */

export interface DebtData {
  source: string;
  dataset: string;
  sourceUrl: string;
  definition: string;
  eurostatUpdated: string | null;
  fetchedAt: string;
  /** Trimestres au format « 2026-Q1 ». */
  quarters: string[];
  france: {
    eurMillions: (number | null)[];
    pctGdp: (number | null)[];
  };
  /** Dette en % du PIB par pays (FR, DE, IT, ES, EA20). */
  comparePctGdp: Record<string, (number | null)[]>;
  /** Population de la France au 1er janvier de chaque année. */
  population: { years: string[]; values: (number | null)[] };
}

/** Taux des obligations d'État à 10 ans (OAT pour la France), moyennes mensuelles. */
export interface RatesData {
  source: string;
  dataset: string;
  sourceUrl: string;
  definition: string;
  eurostatUpdated: string | null;
  /** Mois au format « 2026-08 ». */
  months: string[];
  france: (number | null)[];
  /** Allemagne, Italie, Espagne. */
  compare: Record<string, (number | null)[]>;
}

/** Un indicateur en % du PIB pour les pays de l'UE27 et leur moyenne. */
export interface EuRanking {
  years: string[];
  eu27: (number | null)[];
  countries: { code: string; label: string; pctGdp: (number | null)[] }[];
}

export interface CofogFunction {
  code: string;
  label: string;
  eurMillions: (number | null)[];
}

export interface SpendingData {
  source: string;
  sourceUrls: { main: string; cofog: string };
  eurostatUpdated: string | null;
  /** Années (« 2025 ») des séries annuelles. */
  years: string[];
  totalEurMillions: (number | null)[];
  totalPctGdp: (number | null)[];
  socialCashEurMillions: (number | null)[];
  socialInKindEurMillions: (number | null)[];
  /** Dépenses totales en % du PIB par pays (FR, DE, IT, ES, EA20). */
  comparePctGdp: Record<string, (number | null)[]>;
  /** Intérêts payés sur la dette. */
  interestEurMillions: (number | null)[];
  interestPctGdp: (number | null)[];
  /** Solde public (négatif = déficit). */
  balanceEurMillions: (number | null)[];
  balancePctGdp: (number | null)[];
  /** Recettes, en % du PIB. */
  revenuePctGdp: (number | null)[];
  taxProductionPctGdp: (number | null)[];
  taxIncomePctGdp: (number | null)[];
  socialContribPctGdp: (number | null)[];
  /** Dépenses totales en % du PIB, pays de l'UE27 et moyenne UE27. */
  euCompare: EuRanking;
  /** Solde public en % du PIB, pays de l'UE27 et moyenne UE27. */
  euDeficit: EuRanking;
  cofog: {
    years: string[];
    totalEurMillions: (number | null)[];
    oldAgeEurMillions: (number | null)[];
    functions: CofogFunction[];
  };
}

export interface DebtProjection {
  /** Dernier chiffre publié, en euros. */
  lastValue: number;
  /** Fin du trimestre auquel il se rapporte (ms epoch). */
  lastAt: number;
  /** Croissance moyenne observée sur 4 trimestres, en euros par milliseconde. */
  perMs: number;
  /** Même croissance ramenée à l'année, en euros. */
  perYear: number;
  lastQuarter: string;
  lastPctGdp: number | null;
  /** Dette estimée à l'instant `now` (ms epoch), en euros. */
  at(now: number): number;
}

/** Fin d'un trimestre « 2026-Q1 » = début du suivant, en UTC. */
export function quarterEnd(quarter: string): number {
  const [year, q] = quarter.split("-Q").map(Number);
  return Date.UTC(year, q * 3, 1);
}

export function formatQuarter(quarter: string): string {
  const [year, q] = quarter.split("-Q");
  return `T${q} ${year}`;
}

/**
 * Prolonge la dernière valeur publiée avec la croissance des 4 derniers trimestres.
 * C'est une estimation, pas une mesure : les données sont trimestrielles.
 */
export function projectDebt(data: DebtData): DebtProjection {
  const values = data.france.eurMillions;
  let last = values.length - 1;
  while (last >= 4 && values[last] === null) last--;
  const prev = last - 4;
  const lastM = values[last];
  const prevM = prev >= 0 ? values[prev] : null;
  if (lastM === null || prevM === null) {
    throw new Error("Pas assez de données pour estimer la dette.");
  }

  const lastValue = lastM * 1e6;
  const lastAt = quarterEnd(data.quarters[last]);
  const span = lastAt - quarterEnd(data.quarters[prev]);
  const perMs = (lastValue - prevM * 1e6) / span;

  return {
    lastValue,
    lastAt,
    perMs,
    perYear: perMs * 365.25 * 24 * 3600 * 1000,
    lastQuarter: data.quarters[last],
    lastPctGdp: data.france.pctGdp[last],
    at: (now) => lastValue + perMs * Math.max(0, now - lastAt),
  };
}

export interface FlowProjection {
  /** Dernière année publiée et son montant, en euros. */
  lastYear: number;
  lastValue: number;
  /** Croissance de la dernière année publiée (0,04 = +4 %). */
  growth: number;
  /** Année en cours pour laquelle on estime le montant. */
  year: number;
  /** Montant annuel estimé pour l'année en cours, en euros. */
  annual: number;
  perMs: number;
  /** Dépense cumulée estimée depuis le 1er janvier de l'année en cours, en euros. */
  at(now: number): number;
}

/**
 * Cumul estimé d'une dépense annuelle depuis le 1er janvier : le dernier montant
 * annuel publié est prolongé jusqu'à l'année en cours avec la croissance de la
 * dernière année, puis réparti uniformément sur l'année.
 */
export function projectAnnualFlow(
  years: string[],
  eurMillions: (number | null)[],
  now: number,
): FlowProjection {
  let last = eurMillions.length - 1;
  while (last >= 1 && eurMillions[last] === null) last--;
  const lastM = eurMillions[last];
  const prevM = last >= 1 ? eurMillions[last - 1] : null;
  if (lastM === null || prevM === null || prevM === 0) {
    throw new Error("Pas assez de données pour estimer cette dépense.");
  }

  const lastYear = Number(years[last]);
  const growth = lastM / prevM - 1;
  const year = Math.max(lastYear, new Date(now).getUTCFullYear());
  const annual = lastM * 1e6 * Math.pow(1 + growth, year - lastYear);
  const start = Date.UTC(year, 0, 1);
  const perMs = annual / (Date.UTC(year + 1, 0, 1) - start);

  return {
    lastYear,
    lastValue: lastM * 1e6,
    growth,
    year,
    annual,
    perMs,
    at: (t) => perMs * Math.max(0, t - start),
  };
}

/** Somme terme à terme de deux séries ; `null` dès qu'une des deux manque. */
export function addSeries(
  a: (number | null)[],
  b: (number | null)[],
): (number | null)[] {
  return a.map((v, i) => (v === null || b[i] === null ? null : v + (b[i] as number)));
}

/** Dernière population connue (au 1er janvier) et son année. */
export function latestPopulation(data: DebtData): { year: number; value: number } | null {
  const { years, values } = data.population;
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v !== null) return { year: Number(years[i]), value: v };
  }
  return null;
}

/** Écart, en points, entre deux séries de taux (a − b) ; `null` si l'une manque. */
export function spread(a: (number | null)[], b: (number | null)[]): (number | null)[] {
  return a.map((v, i) => (v === null || b[i] === null ? null : Math.round((v - (b[i] as number)) * 1000) / 1000));
}

/** Mois « 2026-08 » → ms epoch (1er du mois, UTC). */
export function monthStart(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return Date.UTC(year, m - 1, 1);
}
