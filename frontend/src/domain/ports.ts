import type { DebtData, RatesData, SpendingData } from "./economy";
import type { ChatResult, CorpusHealth, SearchResult } from "./models";

/** Port sortant : accès au programme (implémenté par l'infra HTTP). */
export interface ProgrammeRepository {
  getHealth(): Promise<CorpusHealth>;
  ask(question: string): Promise<ChatResult>;
  search(question: string): Promise<SearchResult>;
}

/** Port sortant : données économiques (implémenté par l'infra HTTP). */
export interface EconomyRepository {
  getDebt(): Promise<DebtData>;
  getRates(): Promise<RatesData>;
  getSpending(): Promise<SpendingData>;
}
