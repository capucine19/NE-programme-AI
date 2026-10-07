<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { SpendingData } from "@domain/economy";
import {
  FONT,
  GRID,
  MUTED,
  NAVY,
  areaGradient,
  nf,
  nf1,
  timeAxis,
  tooltipBase,
  tooltipTitle,
  yearOf,
  yearPoints,
  zoom,
} from "../charts/theme";
import type { Point } from "../charts/theme";
import ChartCard from "./ChartCard.vue";
import SegToggle from "./SegToggle.vue";

const props = defineProps<{ data: SpendingData }>();

const unit = ref<"eur" | "pct">("eur");
const options = [
  { value: "eur" as const, label: "Milliards €" },
  { value: "pct" as const, label: "% du PIB" },
];

const option = computed<EChartsOption>(() => {
  const isEur = unit.value === "eur";
  const points = isEur
    ? yearPoints(props.data.years, props.data.interestEurMillions, 1 / 1000)
    : yearPoints(props.data.years, props.data.interestPctGdp);
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
        return `${tooltipTitle(yearOf(item.value[0]))}<strong style="font-size:15px">${fmt(item.value[1])}</strong>`;
      },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: MUTED, fontSize: 11, formatter: (v: number) => (isEur ? nf.format(v) : `${v} %`) },
    },
    series: [
      {
        type: "line",
        data: points,
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 3, color: NAVY },
        itemStyle: { color: NAVY },
        areaStyle: { color: areaGradient("181,169,129", 0.5) },
      },
    ],
  };
});

</script>

<template>
  <ChartCard
    topic="interets"
    title="Charge des intérêts de la dette"
    :subtitle="`Intérêts payés chaque année par les administrations publiques · ${unit === 'eur' ? 'en milliards d’euros' : 'en % du PIB'}`"
    question="Que propose le programme pour réduire la charge de la dette ?"
    :source="`${data.source} (gov_10a_main)`"
    :source-url="data.sourceUrls.main"
  >
    <template #actions>
      <SegToggle v-model="unit" :options="options" label="Unité" />
    </template>
    <VChart class="chart" :option="option" autoresize />
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
