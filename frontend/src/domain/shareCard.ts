import type { ProgrammeSource, ShareCard } from "./models";

/** Règles de la carte partageable — fonctions pures, sans DOM. */

export const PROGRAMME_URL = "https://www.unenouvelleenergie.fr/notre-programme/";
export const HASHTAG = "#IlSePasseQuelqueChose";

const HEADLINE_MAX = 220;
const POST_MAX = 280;
// X compte toute URL pour 23 caractères (t.co)
const X_URL_LENGTH = 23;
const POST_SOURCE_PREFIX = "\n\nSource officielle : ";
const POST_HASHTAG_SUFFIX = `\n\n${HASHTAG}`;

const EN_BREF = /^[\s>*_-]*en bref\s*[*_]*\s*:\s*[*_]*\s*(.+)$/im;
const SOURCE_TAG = /\[Source\s*:[^\]]*\]/gi;
// Renvoi numéroté vers un extrait : « … » [2]
const CITATION = /\s*\[(\d{1,2})\]/g;
const URL_RE = /https?:\/\/[^\s\])>»"]+/;

/** Markdown du LLM → texte brut d'une ligne, sans les renvois [n] ni [Source : …]. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(SOURCE_TAG, "")
    .replace(CITATION, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/\*\*|__|[*`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?)])/g, "$1")
    .trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** Ligne « En bref » demandée au LLM, sinon début de la réponse. */
export function extractHeadline(answer: string): string {
  const enBref = answer.match(EN_BREF);
  if (enBref) {
    const text = toPlainText(enBref[1]);
    if (text) return truncate(text, HEADLINE_MAX);
  }
  // Phrases du début jusqu'à un résumé d'au moins ~100 caractères
  const sentences = toPlainText(answer.replace(EN_BREF, "")).match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
  let summary = "";
  for (const sentence of sentences) {
    if (summary.length >= 100) break;
    summary = `${summary} ${sentence.trim()}`.trim();
  }
  return truncate(summary, HEADLINE_MAX);
}

/** Première source citée dans la réponse, sinon premier passage utilisé. */
export function extractSource(
  answer: string,
  sources: ProgrammeSource[],
): { title: string; url: string; shortPath: string | null } {
  for (const match of answer.matchAll(CITATION)) {
    const cited = sources[Number(match[1]) - 1];
    if (cited) return { title: cited.pageTitle, url: cited.url, shortPath: cited.shortPath };
  }
  // Ancien format : [Source : titre — section — paragraphe — url]
  const start = answer.search(/\[Source\s*:/i);
  if (start >= 0) {
    const tag = answer.slice(start, start + 400);
    const url = tag.match(URL_RE)?.[0].replace(/[.,;]+$/, "");
    const known = url ? sources.find((s) => s.url === url) : undefined;
    if (known) return { title: known.pageTitle, url: known.url, shortPath: known.shortPath };
    if (url) {
      const title = tag.replace(/^\[Source\s*:\s*/i, "").split(/\s+—\s+/)[0].trim();
      return { title: title || "Programme officiel", url, shortPath: null };
    }
  }
  const first = sources[0];
  return first
    ? { title: first.pageTitle, url: first.url, shortPath: first.shortPath }
    : { title: "Programme officiel", url: PROGRAMME_URL, shortPath: null };
}

export function buildShareCard(
  question: string,
  answer: string,
  sources: ProgrammeSource[],
): ShareCard {
  const source = extractSource(answer, sources);
  return {
    question: question.trim(),
    headline: extractHeadline(answer),
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceShortPath: source.shortPath,
  };
}

/** Texte du post X : la réponse courte + le lien vérifiable vers la source + le hashtag. */
export function buildPostText(card: ShareCard): string {
  const budget = POST_MAX - POST_SOURCE_PREFIX.length - X_URL_LENGTH - POST_HASHTAG_SUFFIX.length;
  return `${truncate(card.headline, budget)}${POST_SOURCE_PREFIX}${card.sourceUrl}${POST_HASHTAG_SUFFIX}`;
}

/** Identifiant d'un post X à partir de son lien (x.com ou twitter.com). */
export function parseXPostId(link: string): string | null {
  return link.match(/(?:x|twitter)\.com\/[^/\s]+\/status(?:es)?\/(\d+)/i)?.[1] ?? null;
}
