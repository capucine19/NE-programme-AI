<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { SpendingData } from "@domain/economy";
import {
  COUNTRIES,
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
import SegToggle from "./SegToggle.vue";

const props = defineProps<{ data: SpendingData }>();

const mainSource = computed(() => ({
  source: `${props.data.source} (gov_10a_main)`,
  url: props.data.sourceUrls.main,
}));
const cofogSource = computed(() => ({
  source: `${props.data.source} (gov_10a_exp, fonctions COFOG)`,
  url: props.data.sourceUrls.cofog,
}));

const legend = {
  top: 0,
  icon: "roundRect",
  itemWidth: 14,
  itemHeight: 4,
  itemGap: 28,
  textStyle: { color: MUTED, fontFamily: FONT, fontSize: 12 },
};
const valueAxis = (formatter: string | ((v: number) => string), scale = false) => ({
  type: "value" as const,
  scale,
  splitLine: { lineStyle: { color: GRID } },
  axisLabel: { color: MUTED, fontSize: 11, formatter },
});

// --- 1. Dépenses publiques totales ---------------------------------------------
const totalUnit = ref<"eur" | "pct">("eur");
const totalOptions = [
  { value: "eur" as const, label: "Milliards €" },
  { value: "pct" as const, label: "% du PIB" },
];

const totalOption = computed<EChartsOption>(() => {
  const isEur = totalUnit.value === "eur";
  const points = isEur
    ? yearPoints(props.data.years, props.data.totalEurMillions, 1 / 1000)
    : yearPoints(props.data.years, props.data.totalPctGdp);
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
    yAxis: valueAxis((v: number) => (isEur ? nf.format(v) : `${v} %`), !isEur),
    series: [
      {
        type: "line",
        data: points,
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 3, color: NAVY },
        itemStyle: { color: NAVY },
        areaStyle: { color: areaGradient("26,38,104") },
      },
    ],
  };
});

// --- 2. Répartition par fonction ------------------------------------------------
const cofogYears = computed(() => props.data.cofog.years);
const yearIdx = ref(props.data.cofog.years.length - 1);
const selectedYear = computed(() => cofogYears.value[yearIdx.value]);

const cofogRows = computed(() => {
  const i = yearIdx.value;
  const total = props.data.cofog.totalEurMillions[i] ?? 0;
  return props.data.cofog.functions
    .map((f) => ({ code: f.code, label: f.label, value: (f.eurMillions[i] ?? 0) / 1000 }))
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ ...r, share: total ? (r.value * 1000 * 100) / total : 0 }));
});

const oldAge = computed(() => {
  const i = yearIdx.value;
  const v = props.data.cofog.oldAgeEurMillions[i];
  const total = props.data.cofog.totalEurMillions[i];
  return v === null || total === null ? null : { value: v / 1000, share: (v * 100) / total };
});

// Écran étroit : libellés plus courts pour laisser de la place aux barres.
const narrow = ref(false);
let mql: MediaQueryList | null = null;
const syncNarrow = () => (narrow.value = mql?.matches ?? false);
onMounted(() => {
  mql = window.matchMedia("(max-width: 640px)");
  syncNarrow();
  mql.addEventListener("change", syncNarrow);
});
onBeforeUnmount(() => mql?.removeEventListener("change", syncNarrow));

const cofogOption = computed<EChartsOption>(() => ({
  textStyle: { fontFamily: FONT },
  grid: { left: narrow.value ? 4 : 24, right: narrow.value ? 62 : 110, top: 8, bottom: 8, containLabel: true },
  animationDuration: 500,
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(20,28,79,0.96)",
    borderWidth: 0,
    padding: [10, 14],
    textStyle: { color: "#fff", fontFamily: FONT, fontSize: 12 },
    formatter: (p: unknown) => {
      const r = cofogRows.value[(p as { dataIndex: number }).dataIndex];
      return `${tooltipTitle(r.label)}<strong style="font-size:15px">${nf.format(r.value)} Md€</strong> · ${nf1.format(r.share)} % des dépenses`;
    },
  },
  xAxis: { type: "value", show: false },
  yAxis: {
    type: "category",
    inverse: true,
    data: cofogRows.value.map((r) => r.label),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: NAVY,
      fontSize: narrow.value ? 10 : 11,
      fontWeight: 600,
      width: narrow.value ? 92 : 150,
      overflow: "break",
    },
  },
  series: [
    {
      type: "bar",
      barWidth: "58%",
      data: cofogRows.value.map((r) => ({
        value: r.value,
        itemStyle: { color: r.code === "GF10" ? GOLD : NAVY, borderRadius: [0, 6, 6, 0] },
      })),
      label: {
        show: true,
        position: "right",
        color: NAVY,
        fontSize: 11,
        fontWeight: 700,
        formatter: (p: unknown) => {
          const r = cofogRows.value[(p as { dataIndex: number }).dataIndex];
          return narrow.value
            ? `${nf.format(r.value)} Md€`
            : `${nf.format(r.value)} Md€ · ${nf1.format(r.share)} %`;
        },
      },
    },
  ],
}));

// --- 3. Prestations sociales ----------------------------------------------------
const socialOption = computed<EChartsOption>(() => {
  const d = props.data;
  const cash = yearPoints(d.years, d.socialCashEurMillions, 1 / 1000);
  const kind = yearPoints(d.years, d.socialInKindEurMillions, 1 / 1000);
  const totalByYear = new Map(
    yearPoints(d.years, d.totalEurMillions, 1 / 1000).map(([t, v]) => [t, v]),
  );
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
        const sum = rows.reduce((s, r) => s + r.value[1], 0);
        const total = totalByYear.get(rows[0].value[0]);
        return (
          tooltipTitle(yearOf(rows[0].value[0])) +
          rows.map((r) => tooltipRow(r.marker, r.seriesName, `${nf.format(r.value[1])} Md€`)).join("") +
          `<div style="border-top:1px solid rgba(255,255,255,.25);margin-top:5px;padding-top:5px">` +
          tooltipRow("", "Total", `${nf.format(sum)} Md€`) +
          (total ? tooltipRow("", "Part des dépenses publiques", `${nf1.format((sum * 100) / total)} %`) : "") +
          `</div>`
        );
      },
    },
    yAxis: valueAxis((v: number) => nf.format(v)),
    series: [
      {
        name: "Prestations en espèces",
        type: "line",
        stack: "social",
        data: cash,
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 2, color: NAVY },
        itemStyle: { color: NAVY },
        areaStyle: { color: areaGradient("26,38,104", 0.55) },
      },
      {
        name: "Prestations en nature (via le marché)",
        type: "line",
        stack: "social",
        data: kind,
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 2, color: GOLD },
        itemStyle: { color: GOLD },
        areaStyle: { color: areaGradient("181,169,129", 0.6) },
      },
    ],
  };
});

// --- 4. Retraites (fonction « vieillesse ») -------------------------------------
const oldAgeUnit = ref<"eur" | "pct">("eur");
const oldAgeOptions = [
  { value: "eur" as const, label: "Milliards €" },
  { value: "pct" as const, label: "% des dépenses" },
];

const oldAgeOption = computed<EChartsOption>(() => {
  const c = props.data.cofog;
  const isEur = oldAgeUnit.value === "eur";
  const values = isEur
    ? c.oldAgeEurMillions.map((v) => (v === null ? null : v / 1000))
    : c.oldAgeEurMillions.map((v, i) => {
        const t = c.totalEurMillions[i];
        return v === null || t === null ? null : (v * 100) / t;
      });
  const fmt = (v: number) => (isEur ? `${nf.format(v)} Md€` : `${nf1.format(v)} % des dépenses`);
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
    yAxis: valueAxis((v: number) => (isEur ? nf.format(v) : `${v} %`), !isEur),
    series: [
      {
        type: "line",
        data: yearPoints(c.years, values),
        showSymbol: false,
        smooth: 0.15,
        lineStyle: { width: 3, color: GOLD },
        itemStyle: { color: GOLD },
        areaStyle: { color: areaGradient("181,169,129", 0.5) },
      },
    ],
  };
});

// --- 5a. Classement des pays de l'UE27 ------------------------------------------
const euYears = computed(() => props.data.euCompare.years);
const euIdx = ref(props.data.euCompare.years.length - 1);
const euYear = computed(() => euYears.value[euIdx.value]);

const euRows = computed(() => {
  const i = euIdx.value;
  const c = props.data.euCompare;
  const rows = c.countries
    .map((x) => ({ code: x.code, label: x.label, value: x.pctGdp[i] }))
    .filter((r): r is { code: string; label: string; value: number } => r.value !== null);
  const avg = c.eu27[i];
  const all = avg === null ? rows : [...rows, { code: "EU27", label: "Moyenne UE27", value: avg }];
  return all.sort((a, b) => b.value - a.value);
});

const franceRank = computed(() => {
  const countries = euRows.value.filter((r) => r.code !== "EU27");
  const rank = countries.findIndex((r) => r.code === "FR") + 1;
  return rank > 0 ? { rank, of: countries.length } : null;
});

const euLeader = computed(() => euRows.value.find((r) => r.code !== "EU27") ?? null);

const euOption = computed<EChartsOption>(() => ({
  textStyle: { fontFamily: FONT },
  grid: { left: narrow.value ? 4 : 12, right: narrow.value ? 48 : 56, top: 4, bottom: 4, containLabel: true },
  animationDuration: 500,
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(20,28,79,0.96)",
    borderWidth: 0,
    padding: [10, 14],
    textStyle: { color: "#fff", fontFamily: FONT, fontSize: 12 },
    formatter: (p: unknown) => {
      const r = euRows.value[(p as { dataIndex: number }).dataIndex];
      return `${tooltipTitle(`${r.label} · ${euYear.value}`)}<strong style="font-size:15px">${nf1.format(r.value)} % du PIB</strong>`;
    },
  },
  xAxis: { type: "value", show: false, min: 0 },
  yAxis: {
    type: "category",
    inverse: true,
    data: euRows.value.map((r) => r.label),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: NAVY,
      fontSize: narrow.value ? 10 : 11,
      fontWeight: 600,
      interval: 0,
    },
  },
  series: [
    {
      type: "bar",
      barWidth: "62%",
      data: euRows.value.map((r) => ({
        value: r.value,
        itemStyle: {
          color: r.code === "FR" ? NAVY : r.code === "EU27" ? GOLD : "#b8bfd6",
          borderRadius: [0, 5, 5, 0],
        },
      })),
      label: {
        show: true,
        position: "right",
        color: NAVY,
        fontSize: 11,
        fontWeight: 700,
        formatter: (p: unknown) => `${nf1.format((p as { value: number }).value)} %`,
      },
    },
  ],
}));

// --- 5b. Comparaison européenne dans le temps -----------------------------------
const compareOption = computed<EChartsOption>(() => ({
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
        tooltipTitle(yearOf(rows[0].value[0])) +
        sorted.map((r) => tooltipRow(r.marker, r.seriesName, `${nf1.format(r.value[1])} %`)).join("")
      );
    },
  },
  yAxis: valueAxis("{value} %"),
  series: COUNTRIES.map((c) => ({
    name: c.label,
    type: "line" as const,
    data: yearPoints(props.data.years, props.data.comparePctGdp[c.code] ?? []),
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
    title="Évolution des dépenses publiques"
    subtitle="Total des dépenses des administrations publiques, par année"
    question="Que propose le programme pour réduire les dépenses publiques ?"
    :source="mainSource.source"
    :source-url="mainSource.url"
  >
    <template #actions>
      <SegToggle v-model="totalUnit" :options="totalOptions" label="Unité" />
    </template>
    <VChart class="chart" :option="totalOption" autoresize />
  </ChartCard>

  <ChartCard
    title="À quoi sert l’argent public ?"
    :subtitle="`Dépenses par fonction en ${selectedYear}`"
    question="Quelles économies et quelles réformes de l’État le programme propose-t-il ?"
    :source="cofogSource.source"
    :source-url="cofogSource.url"
  >
    <template #actions>
      <label class="year">
        <span>{{ selectedYear }}</span>
        <input
          v-model.number="yearIdx"
          type="range"
          :min="0"
          :max="cofogYears.length - 1"
          step="1"
          aria-label="Année"
        />
      </label>
    </template>
    <VChart class="chart bars" :option="cofogOption" autoresize />
    <p v-if="oldAge" class="aside">
      Dont retraites (fonction « vieillesse » de la protection sociale) :
      <strong>{{ nf.format(oldAge.value) }} Md€</strong>, soit
      {{ nf1.format(oldAge.share) }} % des dépenses publiques.
    </p>
  </ChartCard>

  <ChartCard
    title="Prestations sociales"
    subtitle="Prestations en espèces et prestations en nature achetées au secteur marchand"
    question="Que propose le programme sur les prestations sociales et les aides sociales ?"
    :source="mainSource.source"
    :source-url="mainSource.url"
  >
    <VChart class="chart" :option="socialOption" autoresize />
  </ChartCard>

  <ChartCard
    title="Retraites"
    subtitle="Dépenses de la fonction « vieillesse » (pensions et services aux retraités)"
    question="Que propose le programme sur les retraites ?"
    :source="cofogSource.source"
    :source-url="cofogSource.url"
  >
    <template #actions>
      <SegToggle v-model="oldAgeUnit" :options="oldAgeOptions" label="Unité" />
    </template>
    <VChart class="chart" :option="oldAgeOption" autoresize />
  </ChartCard>

  <ChartCard
    title="Dépenses publiques en % du PIB : les pays de l’UE"
    :subtitle="`Total des dépenses des administrations publiques, ${euYear}`"
    question="Que propose le programme pour réduire le poids de la dépense publique dans le PIB ?"
    :source="mainSource.source"
    :source-url="mainSource.url"
  >
    <template #actions>
      <label class="year">
        <span>{{ euYear }}</span>
        <input
          v-model.number="euIdx"
          type="range"
          :min="0"
          :max="euYears.length - 1"
          step="1"
          aria-label="Année"
        />
      </label>
    </template>
    <VChart class="chart eu" :option="euOption" autoresize />
    <p v-if="franceRank" class="aside">
      En {{ euYear }}, la France est au <strong>{{ franceRank.rank }}<sup>e</sup> rang</strong> sur
      {{ franceRank.of }} pays de l’UE pour le poids des dépenses publiques<template
        v-if="franceRank.rank > 1 && euLeader"
        >, derrière {{ euLeader.label }} ({{ nf1.format(euLeader.value) }} %)</template
      >.
    </p>
  </ChartCard>

  <ChartCard
    title="Dépenses publiques : la France face à ses voisins"
    subtitle="Total des dépenses en % du PIB"
    question="Que propose le programme pour réduire le poids de la dépense publique dans le PIB ?"
    :source="mainSource.source"
    :source-url="mainSource.url"
  >
    <VChart class="chart" :option="compareOption" autoresize />
  </ChartCard>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 24rem;
}

.chart.bars {
  height: 25rem;
}

.chart.eu {
  height: 38rem;
}

.year {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--navy);
  font-variant-numeric: tabular-nums;
}

.year input {
  width: 9rem;
  accent-color: var(--navy);
}

.aside {
  margin: 0.4rem 0 0;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  background: #f4f1e8;
  font-size: 0.82rem;
  color: var(--navy);
}

@media (max-width: 640px) {
  .chart {
    height: 20rem;
  }

  .chart.bars {
    height: 27rem;
  }

  .chart.eu {
    height: 40rem;
  }
}
</style>
