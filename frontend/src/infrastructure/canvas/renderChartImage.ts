import { getInstanceByDom, init } from "echarts/core";
import { sourceShort, type ChartImageSpec } from "@domain/chartExport";
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

const WIDTH = 1200;
const PAD = 56;
const SCALE = 2;
const BAND = 84;
const INNER = WIDTH - PAD * 2;

const CREAM = "#f4f1e8";
const MUTED = "#5c648a";
const GOLD_DARK = "#7a6f4a";

/** Taille de rendu du graphique exporté (px CSS) : identique quel que soit l'écran. */
const EXPORT_WIDTH = 720;
const EXPORT_HEIGHTS: Record<string, number> = { eu: 620, bars: 410, default: 400 };
const EXPORT_PIXEL_RATIO = 2;

export interface CapturedChart {
  image: HTMLImageElement;
  /** Taille de rendu du graphique en px CSS. */
  width: number;
  height: number;
}

/**
 * Rend le graphique ECharts contenu dans `root` sur une instance hors écran de taille fixe,
 * sans barre de zoom ni animation : l'image est la même sur téléphone et sur ordinateur.
 */
export async function captureChart(root: HTMLElement): Promise<CapturedChart> {
  // vue-echarts initialise ECharts sur un élément interne (« .echarts-host »)
  const candidates = root.querySelectorAll<HTMLElement>(".echarts-host, .echarts, .chart");
  let live: ReturnType<typeof getInstanceByDom>;
  for (const el of candidates) {
    live = getInstanceByDom(el);
    if (live) break;
  }
  if (!live) throw new Error("Graphique introuvable.");

  const kind = root.querySelector(".chart.eu") ? "eu" : root.querySelector(".chart.bars") ? "bars" : "default";
  const width = EXPORT_WIDTH;
  const height = EXPORT_HEIGHTS[kind];

  const option = live.getOption() as Record<string, unknown> & {
    dataZoom?: { type?: string }[];
    grid?: { bottom?: number }[];
  };
  const hasSlider = (option.dataZoom ?? []).some((z) => z.type === "slider");
  const exportOption = {
    ...option,
    animation: false,
    dataZoom: [],
    // La barre de zoom retirée libère sa place en bas du graphique
    grid: (option.grid ?? []).map((g) => ({ ...g, bottom: hasSlider ? 16 : g.bottom })),
  };

  const host = document.createElement("div");
  const copy = init(host, undefined, { renderer: "canvas", width, height });
  try {
    copy.setOption(exportOption as never, true);
    const url = copy.getDataURL({
      type: "png",
      pixelRatio: EXPORT_PIXEL_RATIO,
      backgroundColor: "#ffffff",
    });
    const image = new Image();
    image.src = url;
    await image.decode();
    return { image, width, height };
  } finally {
    copy.dispose();
  }
}

/** Plus grande taille (60 → 36 px) qui tient en `maxLines` lignes. */
function fitHeadline(ctx: Ctx, text: string, maxWidth: number, maxLines: number) {
  for (let size = 60; size >= 36; size -= 2) {
    ctx.font = font(800, size);
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = font(800, 36);
  return { size: 36, lines: clampLines(ctx, text, maxWidth, maxLines) };
}

function drawHeader(ctx: Ctx) {
  ctx.fillStyle = NAVY_DEEP;
  ctx.fillRect(0, 0, WIDTH, BAND);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, BAND - 4, WIDTH, 4);

  drawFlagMark(ctx, PAD, (BAND - 4 - 36) / 2);
  ctx.textBaseline = "middle";
  ctx.font = font(800, 24);
  setSpacing(ctx, 1.5);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("LA FRANCE EN CHIFFRES", PAD + 72, (BAND - 4) / 2);

  ctx.font = font(700, 18);
  setSpacing(ctx, 2.4);
  ctx.fillStyle = GOLD;
  ctx.textAlign = "right";
  ctx.fillText("DONNÉES PUBLIQUES", WIDTH - PAD, (BAND - 4) / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  setSpacing(ctx, 0);
}

function navyBackground(ctx: Ctx, top: number, height: number) {
  const bg = ctx.createLinearGradient(0, top, 0, top + height);
  bg.addColorStop(0, NAVY);
  bg.addColorStop(1, NAVY_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, top, WIDTH, height);

  const glow = ctx.createRadialGradient(180, top, 0, 180, top, 560);
  glow.addColorStop(0, "rgba(181, 169, 129, 0.22)");
  glow.addColorStop(1, "rgba(181, 169, 129, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, top, WIDTH, height);
}

export async function renderChartImage(
  spec: ChartImageSpec,
  chart: CapturedChart,
): Promise<Blob> {
  await loadFonts();

  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("Canvas indisponible dans ce navigateur.");
  const promo = spec.promo;

  // --- Mesures -------------------------------------------------------------------
  const HERO_PAD = 40;
  const hero = promo ? fitHeadline(probe, promo.headline.toUpperCase(), INNER - 30, 2) : null;
  const heroHeight = hero ? HERO_PAD * 2 + hero.lines.length * Math.round(hero.size * 1.14) : 0;

  probe.font = font(800, 32);
  const titleLines = clampLines(probe, spec.title.toUpperCase(), INNER, 2);
  probe.font = font(500, 20);
  const subLines = spec.subtitle ? clampLines(probe, spec.subtitle, INNER, 2) : [];
  const titleBlock = 34 + titleLines.length * 40 + (subLines.length ? 6 + subLines.length * 27 : 0) + 22;
  const chartHeight = Math.round((chart.height * INNER) / chart.width);

  probe.font = font(600, 25);
  const quoteLines = promo ? clampLines(probe, `« ${promo.quote} »`, INNER - 36, 6) : [];
  const QUOTE_LH = 36;
  const quoteHeight = promo ? 106 + quoteLines.length * QUOTE_LH : 0;

  const CTA_HEIGHT = 178;
  const FOOT_HEIGHT = 84;
  const height =
    BAND + heroHeight + titleBlock + chartHeight + 28 + quoteHeight + CTA_HEIGHT + FOOT_HEIGHT;

  // --- Dessin --------------------------------------------------------------------
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible dans ce navigateur.");
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);
  drawHeader(ctx);
  let y = BAND;

  // Slogan
  if (promo && hero) {
    navyBackground(ctx, y, heroHeight);
    ctx.fillStyle = GOLD;
    ctx.fillRect(PAD, y + HERO_PAD, 8, heroHeight - HERO_PAD * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = font(800, hero.size);
    const lh = Math.round(hero.size * 1.14);
    let ty = y + HERO_PAD + hero.size * 0.86;
    for (const line of hero.lines) {
      ctx.fillText(line, PAD + 30, ty);
      ty += lh;
    }
    y += heroHeight;
  }

  // Titre du graphique
  y += 34;
  ctx.font = font(800, 32);
  ctx.fillStyle = NAVY;
  for (const line of titleLines) {
    y += 32;
    ctx.fillText(line, PAD, y);
    y += 8;
  }
  if (subLines.length) {
    ctx.font = font(500, 20);
    ctx.fillStyle = MUTED;
    y += 6;
    for (const line of subLines) {
      y += 22;
      ctx.fillText(line, PAD, y);
      y += 5;
    }
  }
  y += 22;

  // Graphique : le bitmap capturé fait `ratio` × la taille CSS
  const ratio = chart.image.naturalWidth / chart.width;
  ctx.drawImage(chart.image, 0, 0, chart.width * ratio, chart.height * ratio, PAD, y, INNER, chartHeight);
  y += chartHeight + 28;

  // Citation exacte du programme
  if (promo) {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, y, WIDTH, quoteHeight);
    ctx.fillStyle = GOLD;
    ctx.fillRect(PAD, y + 30, 5, quoteLines.length * QUOTE_LH + 8);

    let qy = y + 38 + 24;
    ctx.font = font(600, 25);
    ctx.fillStyle = NAVY;
    for (const line of quoteLines) {
      ctx.fillText(line, PAD + 28, qy);
      qy += QUOTE_LH;
    }
    qy += 4;
    ctx.font = font(800, 18);
    ctx.fillStyle = GOLD_DARK;
    ctx.fillText(ellipsize(ctx, `Extrait du programme · ${promo.sourceTitle}`, INNER - 28), PAD + 28, qy + 6);
    y += quoteHeight;
  }

  // Appel à l'engagement
  navyBackground(ctx, y, CTA_HEIGHT);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, y, WIDTH, 4);

  const pillText = "Agir  →";
  ctx.font = font(800, 28);
  const pillW = Math.min(ctx.measureText(pillText).width + 76, 330);
  const pillX = WIDTH - PAD - pillW;
  const pillY = y + 44;
  roundRect(ctx, pillX, pillY, pillW, 64, 32);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(ellipsize(ctx, pillText, pillW - 30), pillX + pillW / 2, pillY + 33);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = font(600, 16);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.textAlign = "right";
  ctx.fillText(spec.siteHost, WIDTH - PAD, pillY + 98);
  ctx.textAlign = "left";

  const textW = pillX - PAD - 30;
  ctx.font = font(800, 38);
  ctx.fillStyle = "#ffffff";
  const ctaTitle = clampLines(ctx, "Engagez-vous", textW, 2);
  let cy = y + 74;
  for (const line of ctaTitle) {
    ctx.fillText(line, PAD, cy);
    cy += 44;
  }
  ctx.font = font(500, 21);
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.fillText(ellipsize(ctx, "Informez-vous sur le programme, posez vos questions, passez à l’action.", textW), PAD, cy - 4);
  y += CTA_HEIGHT;

  // Pied : source discrète et mention citoyenne
  ctx.fillStyle = "#eef0f7";
  ctx.fillRect(0, y, WIDTH, FOOT_HEIGHT);
  ctx.font = font(600, 16);
  ctx.fillStyle = MUTED;
  const source = sourceShort(spec.source);
  ctx.fillText(source ? `Source : ${source}` : "Source : données publiques", PAD, y + 34);
  ctx.font = font(500, 13);
  ctx.fillText("Visuel citoyen non officiel · données publiques", PAD, y + 58);
  ctx.textAlign = "right";
  ctx.fillText(`${spec.siteHost}/#/economie`, WIDTH - PAD, y + 58);
  ctx.textAlign = "left";

  return canvasToPng(canvas);
}
