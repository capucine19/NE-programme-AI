/** Thème ECharts partagé par les graphiques de la page Économie. */
import { use } from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { monthStart } from "@domain/economy";

use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export const NAVY = "#1a2668";
export const GOLD = "#b5a981";
export const MUTED = "#5c648a";
export const GRID = "#e6e9f2";
export const FONT = "Montserrat, system-ui, sans-serif";

export const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
export const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export type Point = [number, number];

/** Libellé de l'année (UTC) d'un point placé au 1er janvier. */
export function yearOf(ts: number): string {
  return String(new Date(ts).getUTCFullYear());
}

/** Points (date, valeur) d'une série annuelle, en ignorant les valeurs manquantes. */
export function yearPoints(years: string[], values: (number | null)[], scale = 1): Point[] {
  const out: Point[] = [];
  values.forEach((v, i) => {
    if (v !== null) out.push([Date.UTC(Number(years[i]), 0, 1), v * scale]);
  });
  return out;
}

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Libellé « août 2026 » d'un point placé au 1er du mois. */
export function monthOf(ts: number): string {
  return monthFormat.format(new Date(ts));
}

/** Points (date, valeur) d'une série mensuelle « 2026-08 », en ignorant les valeurs manquantes. */
export function monthPoints(months: string[], values: (number | null)[]): Point[] {
  const out: Point[] = [];
  values.forEach((v, i) => {
    if (v !== null) out.push([monthStart(months[i]), v]);
  });
  return out;
}

export const timeAxis = {
  type: "time" as const,
  axisLine: { lineStyle: { color: GRID } },
  axisTick: { show: false },
  axisLabel: { color: MUTED, fontSize: 11 },
  axisPointer: { lineStyle: { color: GOLD, width: 1 } },
};

export const zoom = [
  { type: "inside" as const },
  {
    type: "slider" as const,
    height: 22,
    bottom: 8,
    borderColor: "transparent",
    backgroundColor: "#f1f3f9",
    fillerColor: "rgba(26,38,104,0.12)",
    handleStyle: { color: NAVY, borderColor: NAVY },
    moveHandleStyle: { color: NAVY },
    textStyle: { color: MUTED, fontSize: 10 },
    dataBackground: {
      lineStyle: { color: "#c8cde0" },
      areaStyle: { color: "#e6e9f2" },
    },
  },
];

export const tooltipBase = {
  trigger: "axis" as const,
  backgroundColor: "rgba(20,28,79,0.96)",
  borderWidth: 0,
  padding: [10, 14],
  textStyle: { color: "#fff", fontFamily: FONT, fontSize: 12 },
  axisPointer: { type: "line" as const, lineStyle: { color: GOLD } },
};

export function areaGradient(rgb: string, top = 0.35) {
  return {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: `rgba(${rgb},${top})` },
      { offset: 1, color: `rgba(${rgb},0.02)` },
    ],
  };
}

export const COUNTRIES: { code: string; label: string; color: string }[] = [
  { code: "FR", label: "France", color: NAVY },
  { code: "DE", label: "Allemagne", color: "#8b93b0" },
  { code: "IT", label: "Italie", color: "#c2410c" },
  { code: "ES", label: "Espagne", color: "#b5a981" },
  { code: "EA20", label: "Zone euro", color: "#0f766e" },
];

export function tooltipRow(marker: string, name: string, value: string): string {
  return (
    `<div style="display:flex;justify-content:space-between;gap:18px">` +
    `<span>${marker}${name}</span><strong>${value}</strong></div>`
  );
}

export function tooltipTitle(text: string): string {
  return `<div style="opacity:.7;margin-bottom:4px">${text}</div>`;
}
