import { getInstanceByDom, init } from "echarts/core";
import { sourceDomain, type ChartImageSpec } from "@domain/chartExport";
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
  type Ctx,
} from "./canvasKit";

const WIDTH = 1200;
const PAD = 48;
const SCALE = 2;
const BAND = 84;
const FOOTER = 132;

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
  ctx.fillText("PROGRAMME DAVID LISNARD", PAD + 72, (BAND - 4) / 2);
  setSpacing(ctx, 0);

  ctx.font = font(700, 18);
  setSpacing(ctx, 2.4);
  ctx.fillStyle = GOLD;
  ctx.textAlign = "right";
  ctx.fillText("LES CHIFFRES", WIDTH - PAD, (BAND - 4) / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  setSpacing(ctx, 0);
}

function drawFooter(ctx: Ctx, spec: ChartImageSpec, top: number, height: number) {
  ctx.fillStyle = "#f4f5f9";
  ctx.fillRect(0, top, WIDTH, height);
  ctx.fillStyle = "rgba(181, 169, 129, 0.6)";
  ctx.fillRect(PAD, top, WIDTH - PAD * 2, 2);

  // Pastille du site : ramène le lecteur vers les chiffres et le programme
  const cta = `${spec.siteHost}/#/economie`;
  ctx.font = font(800, 21);
  const ctaWidth = Math.min(ctx.measureText(cta).width + 52, 460);
  const ctaX = WIDTH - PAD - ctaWidth;
  const ctaY = top + 30;
  roundRect(ctx, ctaX, ctaY, ctaWidth, 52, 26);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.textBaseline = "middle";
  ctx.fillText(ellipsize(ctx, cta, ctaWidth - 40), ctaX + 26, ctaY + 26);
  ctx.textBaseline = "alphabetic";

  const textWidth = ctaX - PAD - 28;
  ctx.font = font(700, 23);
  ctx.fillStyle = NAVY;
  const source = spec.source ? `Source : ${spec.source}` : "Source : données publiques";
  ctx.fillText(ellipsize(ctx, source, textWidth), PAD, top + 50);

  const domain = sourceDomain(spec.sourceUrl);
  if (domain) {
    ctx.font = font(600, 19);
    ctx.fillStyle = "#5c648a";
    ctx.fillText(ellipsize(ctx, domain, textWidth), PAD, top + 80);
  }

  ctx.font = font(500, 14);
  ctx.fillStyle = "#5c648a";
  ctx.fillText(
    "Outil citoyen non officiel · données publiques · les compteurs du site sont des estimations",
    PAD,
    top + height - 18,
  );
}

/** Compose l'image : bandeau, titre, graphique, source (Eurostat…) et adresse du site. */
export async function renderChartImage(
  spec: ChartImageSpec,
  chart: CapturedChart,
): Promise<Blob> {
  await loadFonts();

  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("Canvas indisponible dans ce navigateur.");
  const innerWidth = WIDTH - PAD * 2;

  probe.font = font(800, 34);
  const titleLines = clampLines(probe, spec.title.toUpperCase(), innerWidth, 2);
  probe.font = font(500, 21);
  const subLines = spec.subtitle ? clampLines(probe, spec.subtitle, innerWidth, 2) : [];

  const titleBlock = 34 + titleLines.length * 42 + (subLines.length ? 8 + subLines.length * 28 : 0) + 22;
  const chartHeight = Math.round((chart.height * innerWidth) / chart.width);
  const height = BAND + titleBlock + chartHeight + 24 + FOOTER;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible dans ce navigateur.");
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);
  drawHeader(ctx);

  let y = BAND + 34;
  ctx.font = font(800, 34);
  ctx.fillStyle = NAVY;
  setSpacing(ctx, 0.5);
  for (const line of titleLines) {
    y += 34;
    ctx.fillText(line, PAD, y);
    y += 8;
  }
  setSpacing(ctx, 0);
  if (subLines.length) {
    ctx.font = font(500, 21);
    ctx.fillStyle = "#5c648a";
    y += 4;
    for (const line of subLines) {
      y += 24;
      ctx.fillText(line, PAD, y);
      y += 4;
    }
  }
  y += 22;

  // Le bitmap capturé fait `ratio` × la taille CSS ; on n'en garde que la zone utile.
  const ratio = chart.image.naturalWidth / chart.width;
  ctx.drawImage(
    chart.image,
    0,
    0,
    chart.width * ratio,
    chart.height * ratio,
    PAD,
    y,
    innerWidth,
    chartHeight,
  );

  drawFooter(ctx, spec, height - FOOTER, FOOTER);
  return canvasToPng(canvas);
}
