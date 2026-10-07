/** Utilitaires de dessin canvas partagés par les visuels exportés (carte de partage, graphiques). */

export const NAVY = "#1a2668";
export const NAVY_DEEP = "#141c4f";
export const GOLD = "#b5a981";
export const FONT = "Montserrat, system-ui, sans-serif";

export type Ctx = CanvasRenderingContext2D;

export function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT}`;
}

export function setSpacing(ctx: Ctx, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

export function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Coupe à maxLines lignes, avec points de suspension sur la dernière. */
export function clampLines(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const lines = wrap(ctx, text, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = `${kept[maxLines - 1]}…`;
  while (ctx.measureText(last).width > maxWidth && last.length > 1) {
    last = `${last.slice(0, -2).trimEnd()}…`;
  }
  kept[maxLines - 1] = last;
  return kept;
}

export function ellipsize(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Pastille tricolore (bleu / blanc / rouge) de la marque. */
export function drawFlagMark(ctx: Ctx, x: number, y: number) {
  const stripes = ["#002395", "#ffffff", "#ed2939"];
  ctx.save();
  roundRect(ctx, x, y, 54, 36, 6);
  ctx.clip();
  stripes.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + i * 18, y, 18, 36);
  });
  ctx.restore();
}

export async function loadFonts() {
  try {
    await Promise.all(
      [font(500, 14), font(600, 30), font(700, 18), font(800, 40)].map((f) =>
        document.fonts.load(f),
      ),
    );
  } catch {
    // Police système en repli
  }
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Échec de la création de l'image."))),
      "image/png",
    );
  });
}
