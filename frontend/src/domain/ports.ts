import type { DebtData, SpendingData } from "./economy";
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
  getSpending(): Promise<SpendingData>;
}
