<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import { formatQuarter, quarterEnd } from "@domain/economy";
import type { DebtData } from "@domain/economy";
import {
  COUNTRIES,
  FONT,
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
  zoom,
} from "../charts/theme";
import type { Point } from "../charts/theme";
import ChartCard from "./ChartCard.vue";
import SegToggle from "./SegToggle.vue";

const props = defineProps<{ data: DebtData }>();

const unit = ref<"eur" | "pct">("eur");
const unitOptions = [
  { value: "eur" as const, label: "Milliards €" },
  { value: "pct" as const, label: "% du PIB" },
];

function toPoints(values: (number | null)[], scale = 1): Point[] {
  const out: Point[] = [];
  values.forEach((v, i) => {
    if (v !== null) out.push([quarterEnd(props.data.quarters[i]), v * scale]);
  });
  return out;
}

/** Libellé « T1 2026 » du trimestre qui se termine à `ts`. */
function quarterOf(ts: number): string {
  const d = new Date(ts - 1);
  return formatQuarter(`${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`);
}

const debtOption = computed<EChartsOption>(() => {
  const isEur = unit.value === "eur";
  const points = isEur
    ? toPoints(props.data.france.eurMillions, 1 / 1000)
    : toPoints(props.data.france.pctGdp);
  const fmt = (v: number) => (isEur ? `${nf.format(v)} Md€` : `${nf1.format(v)} % du PIB`);
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
        return `${tooltipTitle(quarterOf(item.value[0]))}<strong style="font-size:15px">${fmt(item.value[1])}</strong>`;
      },
    },
    yAxis: {
      type: "value",
      scale: !isEur,
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: {
        color: MUTED,
        fontSize: 11,
        formatter: (v: number) => (isEur ? `${nf.format(v)}` : `${v} %`),
      },
    },
    series: [
      {
        type: "line",
        data: points,
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 3, color: NAVY },
        itemStyle: { color: NAVY },
        emphasis: { focus: "series" },
        areaStyle: { color: areaGradient("26,38,104") },
      },
    ],
  };
});

const compareOption = computed<EChartsOption>(() => ({
  textStyle: { fontFamily: FONT },
  xAxis: timeAxis,
  dataZoom: zoom,
  grid: { left: 8, right: 16, top: 44, bottom: 64, containLabel: true },
  animationDuration: 900,
  legend: {
    top: 0,
    icon: "roundRect",
    itemWidth: 14,
    itemHeight: 4,
    textStyle: { color: MUTED, fontFamily: FONT, fontSize: 12 },
  },
  tooltip: {
    ...tooltipBase,
    formatter: (p: unknown) => {
      const rows = p as { value: Point; marker: string; seriesName: string }[];
      const sorted = [...rows].sort((a, b) => b.value[1] - a.value[1]);
      return (
        tooltipTitle(quarterOf(rows[0].value[0])) +
        sorted.map((r) => tooltipRow(r.marker, r.seriesName, `${nf1.format(r.value[1])} %`)).join("")
      );
    },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: GRID } },
    axisLabel: { color: MUTED, fontSize: 11, formatter: "{value} %" },
  },
  series: COUNTRIES.map((c) => ({
    name: c.label,
    type: "line" as const,
    data: toPoints(props.data.comparePctGdp[c.code] ?? []),
    showSymbol: false,
    smooth: 0.15,
    lineStyle: { width: c.code === "FR" ? 3.5 : 1.8, color: c.color },
    itemStyle: { color: c.color },
    emphasis: { focus: "series" as const },
    z: c.code === "FR" ? 10 : 1,
  })),
}));
</script>

<template>
  <ChartCard
    title="Évolution de la dette publique"
    subtitle="Dette brute des administrations publiques, fin de trimestre"
    question="Que propose le programme pour réduire la dette publique ?"
    :source="`${data.source} (${data.dataset})`"
    :source-url="data.sourceUrl"
  >
    <template #actions>
      <SegToggle v-model="unit" :options="unitOptions" label="Unité" />
    </template>
    <VChart class="chart" :option="debtOption" autoresize />
  </ChartCard>

  <ChartCard
    title="La France face à ses voisins"
    subtitle="Dette publique en % du PIB"
    question="Que propose le programme pour réduire la dette publique par rapport au PIB ?"
    :source="`${data.source} (${data.dataset})`"
    :source-url="data.sourceUrl"
  >
    <VChart class="chart" :option="compareOption" autoresize />
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
