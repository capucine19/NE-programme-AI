/**
 * Habillage des images exportées : un slogan par thème et une citation tirée mot pour mot du
 * programme publié sur unenouvelleenergie.fr. L'image elle-même ne nomme ni le parti ni son
 * président : seule la page d'origine du texte (`sourceTitle`) est indiquée.
 *
 * Règles :
 * - la citation est copiée telle quelle depuis la page `sourceUrl` (`scripts/check_promo_quotes.py`
 *   vérifie qu'elle figure bien dans le corpus) ; « […] » marque un passage coupé ;
 * - le slogan reprend les termes du programme, il n'est pas présenté comme une citation.
 */

export type ChartTopic =
  | "dette"
  | "interets"
  | "deficit"
  | "comptes"
  | "depenses"
  | "prelevements"
  | "social"
  | "retraites";

export interface ChartPromo {
  /** Slogan en grand en haut de l'image (formulé avec les termes du programme). */
  headline: string;
  /** Citation exacte. */
  quote: string;
  /** Titre de la page du programme d'où vient la citation (affiché sur l'image). */
  sourceTitle: string;
  /** Page d'origine : sert à la vérification, n'est pas affichée sur l'image. */
  sourceUrl: string;
}

const PROGRAMME = "https://www.unenouvelleenergie.fr/notre-programme";

export const CHART_PROMOS: Record<ChartTopic, ChartPromo> = {
  dette: {
    headline: "Stop aux gaspillages et aux doublons",
    quote:
      "s’engager vers la baisse de la dette publique par rapport au PIB, et sans attendre 2027 […] D’abord par un plan de lutte contre les gaspillages et doublons pendant 5 ans",
    sourceTitle: "Être maître de notre destin",
    sourceUrl: `${PROGRAMME}/etre-maitre-de-notre-destin/`,
  },
  interets: {
    headline: "La dette ne s’annule pas",
    quote:
      "Les Français ne doivent pas être entretenus dans l’illusion de l’annulation de la dette ou de son non-remboursement.",
    sourceTitle: "Être maître de notre destin",
    sourceUrl: `${PROGRAMME}/etre-maitre-de-notre-destin/`,
  },
  deficit: {
    headline: "Une règle d’or contre les déficits",
    quote:
      "une règle institutionnelle de limitation des déficits publics. A la fois signal positif pour ses créanciers et garde-fou contre les errements politiques",
    sourceTitle: "Être maître de notre destin",
    sourceUrl: `${PROGRAMME}/etre-maitre-de-notre-destin/`,
  },
  comptes: {
    headline: "Des comptes publics à l’équilibre",
    quote:
      "le plus important est la volonté de construire des budgets de l’Etat et sociaux réalistes, pour parvenir à l’équilibre",
    sourceTitle: "Être maître de notre destin",
    sourceUrl: `${PROGRAMME}/etre-maitre-de-notre-destin/`,
  },
  depenses: {
    headline: "Réduire la dépense publique de 8 points de PIB",
    quote:
      "Comme l’ont montré les exemples de la Suède et de l’Allemagne il est possible de les réduire de 8 points de PIB en 10 ans et de les maintenir en-deçà de 50%.",
    sourceTitle: "Être maître de notre destin",
    sourceUrl: `${PROGRAMME}/etre-maitre-de-notre-destin/`,
  },
  prelevements: {
    headline: "Baisser les prélèvements obligatoires",
    quote: "l’objectif vital de baisse de la part des Prélèvements Obligatoires par rapport au PIB",
    sourceTitle: "Réussir une nouvelle ambition française",
    sourceUrl: `${PROGRAMME}/reussir-une-nouvelle-ambition-francaise/`,
  },
  social: {
    headline: "Réformer l’État-Providence",
    quote:
      "La France a mis en place le système social le plus consommateur de richesses produites au monde, pour une protection des Français élevée mais de moins en moins performante",
    sourceTitle: "Réussir une nouvelle ambition française",
    sourceUrl: `${PROGRAMME}/reussir-une-nouvelle-ambition-francaise/`,
  },
  retraites: {
    headline: "Retraites : sortir du déni",
    quote:
      "Tous les autres pays rallongent la durée d’activité jusqu’à 65 ans au moins. Mais la France reste dans le déni du problème et dans l’erreur sur la solution.",
    sourceTitle: "Réussir une nouvelle ambition française",
    sourceUrl: `${PROGRAMME}/reussir-une-nouvelle-ambition-francaise/`,
  },
};
