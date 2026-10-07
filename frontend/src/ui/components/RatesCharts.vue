<script setup lang="ts">
import { computed } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import { monthStart, spread } from "@domain/economy";
import type { RatesData } from "@domain/economy";
import {
  FONT,
  GRID,
  MUTED,
  NAVY,
  areaGradient,
  monthOf,
  monthPoints,
  nf,
  nf1,
  timeAxis,
  tooltipBase,
  tooltipRow,
  tooltipTitle,
  zoom,
} from "../charts/theme";
import type { Point } from "../charts/theme";
import ChartCard from "./ChartCard.vue";

const props = defineProps<{ data: RatesData }>();

const source = computed(() => `${props.data.source} (${props.data.dataset})`);
const nf2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const legend = {
  top: 0,
  icon: "roundRect",
  itemWidth: 14,
  itemHeight: 4,
  itemGap: 24,
  textStyle: { color: MUTED, fontFamily: FONT, fontSize: 12 },
};

const COUNTRIES = [
  { code: "DE", label: "Allemagne (Bund)", color: "#8b93b0" },
  { code: "IT", label: "Italie (BTP)", color: "#c2410c" },
  { code: "ES", label: "Espagne", color: "#b5a981" },
];

const rateOption = computed<EChartsOption>(() => ({
  textStyle: { fontFamily: FONT },
  xAxis: timeAxis,
  dataZoom: zoom,
  grid: { left: 8, right: 16, top: 44, bottom: 64, containLabel: true },
  animationDuration: 900,
  legend,
  tooltip: {
    ...tooltipBase,
    formatter: (p: unknown) => {
      const rows = p as { value: Point; marker: string; seriesName: string }[];
      const sorted = [...rows].sort((a, b) => b.value[1] - a.value[1]);
      return (
        tooltipTitle(monthOf(rows[0].value[0])) +
        sorted.map((r) => tooltipRow(r.marker, r.seriesName, `${nf2.format(r.value[1])} %`)).join("")
      );
    },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: GRID } },
    axisLabel: { color: MUTED, fontSize: 11, formatter: "{value} %" },
  },
  series: [
    {
      name: "France (OAT 10 ans)",
      type: "line",
      data: monthPoints(props.data.months, props.data.france),
      showSymbol: false,
      lineStyle: { width: 3.5, color: NAVY },
      itemStyle: { color: NAVY },
      areaStyle: { color: areaGradient("26,38,104", 0.22) },
      z: 10,
    },
    ...COUNTRIES.map((c) => ({
      name: c.label,
      type: "line" as const,
      data: monthPoints(props.data.months, props.data.compare[c.code] ?? []),
      showSymbol: false,
      lineStyle: { width: 1.6, color: c.color },
      itemStyle: { color: c.color },
      emphasis: { focus: "series" as const },
    })),
  ],
}));

const spreadOption = computed<EChartsOption>(() => {
  const de = props.data.compare.DE ?? [];
  const frDe = spread(props.data.france, de);
  const itDe = spread(props.data.compare.IT ?? [], de);
  return {
    textStyle: { fontFamily: FONT },
    xAxis: timeAxis,
    dataZoom: zoom,
    grid: { left: 8, right: 16, top: 44, bottom: 64, containLabel: true },
    animationDuration: 900,
    legend,
    tooltip: {
      ...tooltipBase,
      formatter: (p: unknown) => {
        const rows = p as { value: Point; marker: string; seriesName: string }[];
        return (
          tooltipTitle(monthOf(rows[0].value[0])) +
          rows
            .map((r) =>
              tooltipRow(
                r.marker,
                r.seriesName,
                `${r.value[1] >= 0 ? "+" : "−"} ${nf2.format(Math.abs(r.value[1]))} point`,
              ),
            )
            .join("")
        );
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: MUTED, fontSize: 11, formatter: (v: number) => `${nf1.format(v)} pt` },
    },
    series: [
      {
        name: "France − Allemagne",
        type: "line",
        data: monthPoints(props.data.months, frDe),
        showSymbol: false,
        lineStyle: { width: 3, color: NAVY },
        itemStyle: { color: NAVY },
        areaStyle: { color: areaGradient("26,38,104", 0.25) },
        z: 10,
      },
      {
        name: "Italie − Allemagne",
        type: "line",
        data: monthPoints(props.data.months, itDe),
        showSymbol: false,
        lineStyle: { width: 1.6, color: "#c2410c" },
        itemStyle: { color: "#c2410c" },
        emphasis: { focus: "series" },
      },
    ],
  };
});

// Dernier point connu, repris dans les sous-titres
const last = computed(() => {
  const i = props.data.months.length - 1;
  return {
    month: monthOf(monthStart(props.data.months[i])),
    fr: props.data.france[i],
    de: props.data.compare.DE?.[i] ?? null,
  };
});

const rateSubtitle = computed(() => {
  const base = "Rendement de l’emprunt d’État français à 10 ans, moyenne mensuelle depuis 1980";
  return last.value.fr === null ? base : `${base} · ${last.value.month} : ${nf2.format(last.value.fr)} %`;
});

const spreadSubtitle = computed(() => {
  const base = "Taux français moins taux allemand à 10 ans";
  const { fr, de, month } = last.value;
  return fr === null || de === null
    ? base
    : `${base} · ${month} : ${nf.format(Math.round((fr - de) * 100))} points de base`;
});
</script>

<template>
  <ChartCard
    topic="interets"
    title="Taux de l’OAT à 10 ans"
    :subtitle="rateSubtitle"
    question="Que propose le programme pour réduire le coût de la dette ?"
    :source="source"
    :source-url="data.sourceUrl"
  >
    <VChart class="chart" :option="rateOption" autoresize />
  </ChartCard>

  <ChartCard
    topic="interets"
    title="L’écart avec l’Allemagne (spread)"
    :subtitle="spreadSubtitle"
    question="Que propose le programme pour restaurer la crédibilité financière de la France ?"
    :source="source"
    :source-url="data.sourceUrl"
  >
    <VChart class="chart" :option="spreadOption" autoresize />
  </ChartCard>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 24rem;
}

@media (max-width: 640px) {
  .chart {
    height: 20rem;
  }
}
</style>
