<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { EuRanking, SpendingData } from "@domain/economy";
import {
  FONT,
  GOLD,
  GRID,
  MUTED,
  NAVY,
  areaGradient,
  nf,
  nf1,
  timeAxis,
  tooltipBase,
  tooltipRow,
  tooltipTitle,
  yearOf,
  yearPoints,
  zoom,
} from "../charts/theme";
import type { Point } from "../charts/theme";
import ChartCard from "./ChartCard.vue";
import EuRankingChart from "./EuRankingChart.vue";
import SegToggle from "./SegToggle.vue";

const props = defineProps<{ data: SpendingData }>();

const source = computed(() => `${props.data.source} (gov_10a_main)`);
const sourceUrl = computed(() => props.data.sourceUrls.main);
const WARN = "#b42318";

const legend = {
  top: 0,
  icon: "roundRect",
  itemWidth: 14,
  itemHeight: 4,
  itemGap: 24,
  textStyle: { color: MUTED, fontFamily: FONT, fontSize: 12 },
};

// --- Solde public ---------------------------------------------------------------
const balanceUnit = ref<"pct" | "eur">("pct");
const balanceOptions = [
  { value: "pct" as const, label: "% du PIB" },
  { value: "eur" as const, label: "Milliards €" },
];

const balanceOption = computed<EChartsOption>(() => {
  const isPct = balanceUnit.value === "pct";
  const points = isPct
    ? yearPoints(props.data.years, props.data.balancePctGdp)
    : yearPoints(props.data.years, props.data.balanceEurMillions, 1 / 1000);
  const fmt = (v: number) =>
    isPct ? `${v >= 0 ? "+" : "−"} ${nf1.format(Math.abs(v))} % du PIB` : `${v >= 0 ? "+" : "−"} ${nf.format(Math.abs(v))} Md€`;
  return {
    textStyle: { fontFamily: FONT },
    xAxis: timeAxis,
    dataZoom: zoom,
    grid: { left: 8, right: 16, top: 24, bottom: 64, containLabel: true },
    animationDuration: 900,
    tooltip: {
      ...tooltipBase,
      formatter: (p: unknown) => {
        const item = (p as { value: Point }[])[0];
        const label = item.value[1] < 0 ? "Déficit" : "Excédent";
        return `${tooltipTitle(`${label} · ${yearOf(item.value[0])}`)}<strong style="font-size:15px">${fmt(item.value[1])}</strong>`;
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: MUTED, fontSize: 11, formatter: (v: number) => (isPct ? `${v} %` : nf.format(v)) },
    },
    series: [
      {
        type: "bar",
        barWidth: "70%",
        data: points.map(([t, v]) => ({
          value: [t, v],
          itemStyle: { color: v < 0 ? WARN : GOLD, borderRadius: v < 0 ? [0, 0, 3, 3] : [3, 3, 0, 0] },
        })),
        markLine: isPct
          ? {
              silent: true,
              symbol: "none",
              lineStyle: { color: NAVY, type: "dashed", width: 1.5 },
              label: { show: false },
              data: [{ yAxis: -3 }],
            }
          : undefined,
      },
    ],
  };
});

// --- Recettes et dépenses -------------------------------------------------------
const incomeOption = computed<EChartsOption>(() => ({
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
      const [exp, rev] = [rows.find((r) => r.seriesName === "Dépenses"), rows.find((r) => r.seriesName === "Recettes")];
      const gap = exp && rev ? rev.value[1] - exp.value[1] : null;
      return (
        tooltipTitle(yearOf(rows[0].value[0])) +
        rows.map((r) => tooltipRow(r.marker, r.seriesName, `${nf1.format(r.value[1])} %`)).join("") +
        (gap === null
          ? ""
          : `<div style="border-top:1px solid rgba(255,255,255,.25);margin-top:5px;padding-top:5px">${tooltipRow(
              "",
              gap < 0 ? "Déficit" : "Excédent",
              `${nf1.format(Math.abs(gap))} point de PIB`,
            )}</div>`)
      );
    },
  },
  yAxis: {
    type: "value",
    scale: true,
    splitLine: { lineStyle: { color: GRID } },
    axisLabel: { color: MUTED, fontSize: 11, formatter: "{value} %" },
  },
  series: [
    {
      name: "Dépenses",
      type: "line",
      data: yearPoints(props.data.years, props.data.totalPctGdp),
      showSymbol: false,
      smooth: 0.15,
      lineStyle: { width: 3, color: WARN },
      itemStyle: { color: WARN },
    },
    {
      name: "Recettes",
      type: "line",
      data: yearPoints(props.data.years, props.data.revenuePctGdp),
      showSymbol: false,
      smooth: 0.15,
      lineStyle: { width: 3, color: NAVY },
      itemStyle: { color: NAVY },
    },
  ],
}));

// --- Prélèvements ---------------------------------------------------------------
const levyOption = computed<EChartsOption>(() => {
  const d = props.data;
  const parts = [
    { name: "Cotisations sociales", values: d.socialContribPctGdp, color: NAVY, alpha: 0.55 },
    { name: "Impôts sur le revenu et le patrimoine", values: d.taxIncomePctGdp, color: GOLD, alpha: 0.65 },
    { name: "Impôts sur la production (TVA…)", values: d.taxProductionPctGdp, color: "#8b93b0", alpha: 0.5 },
  ];
  return {
    textStyle: { fontFamily: FONT },
    xAxis: timeAxis,
    dataZoom: zoom,
    grid: { left: 8, right: 16, top: 70, bottom: 64, containLabel: true },
    animationDuration: 900,
    // Largeur imposée : la légende passe à la ligne au lieu de se chevaucher sur mobile
    legend: { ...legend, width: "92%", itemGap: 18, textStyle: { ...legend.textStyle, fontSize: 11 } },
    tooltip: {
      ...tooltipBase,
      formatter: (p: unknown) => {
        const rows = p as { value: Point; marker: string; seriesName: string }[];
        const sum = rows.reduce((s, r) => s + r.value[1], 0);
        return (
          tooltipTitle(yearOf(rows[0].value[0])) +
          rows.map((r) => tooltipRow(r.marker, r.seriesName, `${nf1.format(r.value[1])} %`)).join("") +
          `<div style="border-top:1px solid rgba(255,255,255,.25);margin-top:5px;padding-top:5px">${tooltipRow("", "Total", `${nf1.format(sum)} % du PIB`)}</div>`
        );
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: MUTED, fontSize: 11, formatter: "{value} %" },
    },
    series: parts.map((p) => ({
      name: p.name,
      type: "line" as const,
      stack: "levy",
      data: yearPoints(d.years, p.values),
      showSymbol: false,
      smooth: 0.15,
      lineStyle: { width: 1.5, color: p.color },
      itemStyle: { color: p.color },
      areaStyle: { color: areaGradient(p.color === NAVY ? "26,38,104" : p.color === GOLD ? "181,169,129" : "139,147,176", p.alpha) },
    })),
  };
});

// --- Classement UE du déficit (déficit positif, excédent négatif) ---------------
const deficitRanking = computed<EuRanking>(() => {
  const r = props.data.euDeficit;
  const flip = (s: (number | null)[]) => s.map((v) => (v === null ? null : -v));
  return {
    years: r.years,
    eu27: flip(r.eu27),
    countries: r.countries.map((c) => ({ ...c, pctGdp: flip(c.pctGdp) })),
  };
});

const formatDeficit = (v: number) => (v >= 0 ? `${nf1.format(v)} %` : `excédent ${nf1.format(-v)} %`);
</script>

<template>
  <ChartCard
    topic="deficit"
    title="Déficit public"
    :subtitle="`Solde des administrations publiques : recettes moins dépenses · ${balanceUnit === 'pct' ? 'en % du PIB, ligne pointillée : seuil de 3 % du traité de Maastricht' : 'en milliards d’euros'}`"
    question="Que propose le programme pour réduire le déficit public ?"
    :source="source"
    :source-url="sourceUrl"
  >
    <template #actions>
      <SegToggle v-model="balanceUnit" :options="balanceOptions" label="Unité" />
    </template>
    <VChart class="chart" :option="balanceOption" autoresize />
  </ChartCard>

  <ChartCard
    topic="comptes"
    title="Recettes et dépenses publiques"
    subtitle="En % du PIB : l’écart entre les deux courbes est le déficit"
    question="Que propose le programme pour équilibrer les comptes publics ?"
    :source="source"
    :source-url="sourceUrl"
  >
    <VChart class="chart" :option="incomeOption" autoresize />
  </ChartCard>

  <EuRankingChart
    :ranking="deficitRanking"
    topic="deficit"
    title="Déficit public : les pays de l’UE"
    subtitle="Déficit des administrations publiques en % du PIB"
    aside-phrase="pour l’ampleur du déficit public"
    question="Que propose le programme pour réduire le déficit public ?"
    :source="source"
    :source-url="sourceUrl"
    :format="formatDeficit"
  />

  <ChartCard
    topic="prelevements"
    title="D’où viennent les recettes publiques ?"
    subtitle="Cotisations sociales et impôts, en % du PIB"
    question="Que propose le programme sur les impôts et les prélèvements obligatoires ?"
    :source="source"
    :source-url="sourceUrl"
  >
    <VChart class="chart tall" :option="levyOption" autoresize />
  </ChartCard>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 24rem;
}

.chart.tall {
  height: 27rem;
}

@media (max-width: 640px) {
  .chart {
    height: 20rem;
  }

  .chart.tall {
    height: 26rem;
  }
}
</style>
