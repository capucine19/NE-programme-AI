import type { QueryMode } from "@domain/models";

/** Exemples cliquables pour tester l'outil sans rien écrire. */
export const SUGGESTIONS: Record<QueryMode, string[]> = {
  ask: [
    "Que propose-t-il sur l’intelligence artificielle ?",
    "Veut-il baisser les impôts des entreprises ?",
    "Que propose-t-il sur l’immigration ?",
    "Est-il favorable à la retraite par capitalisation ?",
    "Veut-il construire de nouveaux réacteurs nucléaires ?",
    "Que propose-t-il pour l’école ?",
  ],
  search: [
    "intelligence artificielle",
    "impôts de production",
    "police municipale",
    "retraite par capitalisation",
    "nucléaire",
    "carte scolaire",
  ],
};
