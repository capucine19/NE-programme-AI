/** Règles de l'image exportée d'un graphique — fonctions pures, sans DOM. */
import type { ChartPromo } from "./chartPromo";
import { HASHTAG, truncate } from "./shareCard";

export interface ChartImageSpec {
  title: string;
  subtitle?: string;
  /** Slogan et citation du programme affichés sur l'image. */
  promo?: ChartPromo;
  /** Libellé de la source, ex. « Eurostat (gov_10a_main) ». */
  source?: string;
  /** Lien vers le jeu de données d'origine. */
  sourceUrl?: string;
  /** Hôte de ce site, affiché sur l'image pour y ramener le lecteur. */
  siteHost: string;
}

/** « Eurostat (gov_10a_main) » → « Eurostat » : on retire le nom technique du jeu de données. */
export function sourceShort(source: string | undefined): string {
  return (source ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/** Hôte + premier segment du chemin, ex. « ec.europa.eu/eurostat ». */
export function sourceDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const first = u.pathname.split("/").filter(Boolean)[0];
    return first ? `${u.host}/${first}` : u.host;
  } catch {
    return null;
  }
}

export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "graphique"
  );
}

export function chartFileName(title: string): string {
  return `${slugify(title)}.png`;
}

const POST_MAX = 280;
// X compte toute URL pour 23 caractères (t.co)
const X_URL_LENGTH = 23;

/** Texte du post X : titre du graphique, source, lien vers le site et hashtag (≤ 280 caractères). */
export function buildChartPostText(
  spec: Pick<ChartImageSpec, "title" | "subtitle" | "source">,
  url: string,
): string {
  const tail = [
    spec.source ? `Source : ${sourceShort(spec.source)}` : "Source : données publiques",
    url,
    HASHTAG,
  ].join("\n\n");
  // Le lien compte pour 23 caractères quelle que soit sa longueur réelle
  const tailLength = tail.length - url.length + X_URL_LENGTH;
  const headline = spec.subtitle ? `${spec.title} — ${spec.subtitle}` : spec.title;
  return `${truncate(headline, POST_MAX - tailLength - 2)}\n\n${tail}`;
}
