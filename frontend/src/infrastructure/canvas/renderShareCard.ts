import type { ShareCard } from "@domain/models";
import { HASHTAG, truncate } from "@domain/shareCard";
import {
  GOLD,
  NAVY,
  NAVY_DEEP,
  canvasToPng,
  clampLines,
  drawFlagMark,
  ellipsize,
  font,
  loadFonts,
  roundRect,
  setSpacing,
  wrap,
  type Ctx,
} from "./canvasKit";

/** Visuel 16:9 (format affiché en entier dans le fil X), rendu en 2x pour la netteté. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 675;
const SCALE = 2;
const PAD = 60;

function drawLabel(ctx: Ctx, text: string, x: number, y: number) {
  ctx.font = font(700, 18);
  setSpacing(ctx, 2.4);
  ctx.fillStyle = GOLD;
  ctx.fillText(text.toUpperCase(), x, y);
  setSpacing(ctx, 0);
}

function drawBackground(ctx: Ctx) {
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bg.addColorStop(0, NAVY);
  bg.addColorStop(1, NAVY_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = ctx.createRadialGradient(160, 0, 0, 160, 0, 620);
  glow.addColorStop(0, "rgba(181, 169, 129, 0.22)");
  glow.addColorStop(1, "rgba(181, 169, 129, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, 10, CARD_HEIGHT);
}

function drawBrand(ctx: Ctx) {
  const y = PAD - 14;
  drawFlagMark(ctx, PAD, y);

  ctx.textBaseline = "middle";
  ctx.font = font(800, 24);
  setSpacing(ctx, 1.5);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PROGRAMME DAVID LISNARD", PAD + 72, y + 18);
  setSpacing(ctx, 0);

  ctx.font = font(800, 24);
  ctx.fillStyle = GOLD;
  ctx.textAlign = "right";
  ctx.fillText(HASHTAG, CARD_WIDTH - PAD, y + 18);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Plus grande taille (56 → 32 px) qui fait tenir le texte dans la boîte. */
function fitHeadline(ctx: Ctx, text: string, maxWidth: number, maxHeight: number) {
  for (let size = 56; size >= 32; size -= 2) {
    ctx.font = font(800, size);
    const lineHeight = Math.round(size * 1.18);
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) return { size, lineHeight, lines };
  }
  const size = 32;
  const lineHeight = Math.round(size * 1.18);
  ctx.font = font(800, size);
  const lines = clampLines(ctx, text, maxWidth, Math.floor(maxHeight / lineHeight));
  return { size, lineHeight, lines };
}

function drawFooter(ctx: Ctx, card: ShareCard, siteHost: string) {
  const baseY = CARD_HEIGHT - PAD;
  const innerWidth = CARD_WIDTH - PAD * 2;

  ctx.fillStyle = "rgba(181, 169, 129, 0.45)";
  ctx.fillRect(PAD, baseY - 86, innerWidth, 1.5);

  // Pastille d'appel à l'action, sans l'adresse (déjà dans le lien court) :
  // une adresse longue l'élargissait au point de couper le lien
  const cta = "Posez votre question →";
  ctx.font = font(800, 21);
  const ctaWidth = ctx.measureText(cta).width + 52;
  const ctaX = CARD_WIDTH - PAD - ctaWidth;
  roundRect(ctx, ctaX, baseY - 54, ctaWidth, 56, 28);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.textBaseline = "middle";
  ctx.fillText(cta, ctaX + 26, baseY - 26);
  ctx.textBaseline = "alphabetic";

  const textWidth = ctaX - PAD - 28;
  ctx.font = font(700, 23);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillText(ellipsize(ctx, `Source : ${card.sourceTitle}`, textWidth), PAD, baseY - 28);

  // Lien court vers la source, à taper ou recopier (une image n'est pas cliquable)
  ctx.font = font(700, 20);
  ctx.fillStyle = GOLD;
  const sourceLink = card.sourceShortPath
    ? `Vérifier : ${siteHost}${card.sourceShortPath}`
    : "Vérifier : unenouvelleenergie.fr";
  ctx.fillText(ellipsize(ctx, sourceLink, textWidth), PAD, baseY + 2);

  ctx.font = font(500, 14);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("Outil citoyen non officiel · réponses tirées de unenouvelleenergie.fr", PAD, CARD_HEIGHT - 20);
}

export async function renderShareCard(card: ShareCard, siteHost: string): Promise<Blob> {
  await loadFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = CARD_HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible dans ce navigateur.");
  ctx.scale(SCALE, SCALE);

  drawBackground(ctx);
  drawBrand(ctx);

  const innerWidth = CARD_WIDTH - PAD * 2;
  let y = PAD + 82;

  drawLabel(ctx, "La question", PAD, y);
  y += 42;
  ctx.font = font(600, 30);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  const questionLines = clampLines(ctx, `« ${truncate(card.question, 240)} »`, innerWidth, 2);
  for (const line of questionLines) {
    ctx.fillText(line, PAD, y);
    y += 38;
  }

  y += 26;
  drawLabel(ctx, "Ce que dit le programme", PAD, y);
  y += 16;

  const headlineBottom = CARD_HEIGHT - PAD - 110;
  const { size, lineHeight, lines } = fitHeadline(ctx, card.headline, innerWidth, headlineBottom - y);
  ctx.font = font(800, size);
  ctx.fillStyle = "#ffffff";
  y += lineHeight * 0.82;
  for (const line of lines) {
    ctx.fillText(line, PAD, y);
    y += lineHeight;
  }

  drawFooter(ctx, card, siteHost);

  return canvasToPng(canvas);
}
