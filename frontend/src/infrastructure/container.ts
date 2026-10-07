import { HttpEconomyRepository } from "@infra/http/economyApi";
import { HttpProgrammeRepository } from "@infra/http/programmeApi";
import type { EconomyRepository, ProgrammeRepository } from "@domain/ports";

/** Composition root — un seul point d'injection des adaptateurs. */
export const programmeRepository: ProgrammeRepository =
  new HttpProgrammeRepository();

export const economyRepository: EconomyRepository = new HttpEconomyRepository();
