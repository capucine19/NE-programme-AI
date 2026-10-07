<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import VChart from "vue-echarts";
import type { EChartsOption } from "echarts";
import type { ChartTopic } from "@domain/chartPromo";
import type { EuRanking } from "@domain/economy";
import { FONT, GOLD, NAVY, nf1, tooltipTitle } from "../charts/theme";
import ChartCard from "./ChartCard.vue";

const props = withDefaults(
  defineProps<{
    ranking: EuRanking;
    topic?: ChartTopic;
    title: string;
    /** Début du sous-titre ; l'année choisie y est ajoutée. */
    subtitle: string;
    /** Fin de la phrase sous le graphique : « …la France est au 2e rang … <phrase> ». */
    asidePhrase: string;
    question: string;
    source: string;
    sourceUrl: string;
    /** Mise en forme d'une valeur (par défaut « 57,2 % »). */
    format?: (value: number) => string;
  }>(),
  { format: (v: number) => `${nf1.format(v)} %` },
);

const years = computed(() => props.ranking.years);
const idx = ref(props.ranking.years.length - 1);
const year = computed(() => years.value[idx.value]);

const rows = computed(() => {
  const i = idx.value;
  const list = props.ranking.countries
    .map((c) => ({ code: c.code, label: c.label, value: c.pctGdp[i] }))
    .filter((r): r is { code: string; label: string; value: number } => r.value !== null);
  const avg = props.ranking.eu27[i];
  const all = avg === null ? list : [...list, { code: "EU27", label: "Moyenne UE27", value: avg }];
  return all.sort((a, b) => b.value - a.value);
});

const franceRank = computed(() => {
  const countries = rows.value.filter((r) => r.code !== "EU27");
  const rank = countries.findIndex((r) => r.code === "FR") + 1;
  return rank > 0 ? { rank, of: countries.length } : null;
});

const leader = computed(() => rows.value.find((r) => r.code !== "EU27") ?? null);

// Écran étroit : marges réduites pour laisser de la place aux barres.
const narrow = ref(false);
let mql: MediaQueryList | null = null;
const syncNarrow = () => (narrow.value = mql?.matches ?? false);
onMounted(() => {
  mql = window.matchMedia("(max-width: 640px)");
  syncNarrow();
  mql.addEventListener("change", syncNarrow);
});
onBeforeUnmount(() => mql?.removeEventListener("change", syncNarrow));

const option = computed<EChartsOption>(() => ({
  textStyle: { fontFamily: FONT },
  grid: { left: narrow.value ? 4 : 12, right: narrow.value ? 56 : 70, top: 4, bottom: 4, containLabel: true },
  animationDuration: 500,
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(20,28,79,0.96)",
    borderWidth: 0,
    padding: [10, 14],
    textStyle: { color: "#fff", fontFamily: FONT, fontSize: 12 },
    formatter: (p: unknown) => {
      const r = rows.value[(p as { dataIndex: number }).dataIndex];
      return `${tooltipTitle(`${r.label} · ${year.value}`)}<strong style="font-size:15px">${props.format(r.value)}</strong>`;
    },
  },
  xAxis: { type: "value", show: false },
  yAxis: {
    type: "category",
    inverse: true,
    data: rows.value.map((r) => r.label),
    // Étiquettes au bord gauche, même quand une barre part vers la gauche (excédent)
    axisLine: { show: false, onZero: false },
    axisTick: { show: false },
    axisLabel: { color: NAVY, fontSize: narrow.value ? 10 : 11, fontWeight: 600, interval: 0 },
  },
  series: [
    {
      type: "bar",
      barWidth: "62%",
      data: rows.value.map((r) => ({
        value: r.value,
        itemStyle: {
          color: r.code === "FR" ? NAVY : r.code === "EU27" ? GOLD : "#b8bfd6",
          borderRadius: r.value >= 0 ? [0, 5, 5, 0] : [5, 0, 0, 5],
        },
        // Toujours à droite : pour une barre négative, l'étiquette se place à droite du zéro,
        // dans l'espace libre, au lieu de recouvrir le nom du pays à gauche.
        label: { position: "right" },
      })),
      label: {
        show: true,
        color: NAVY,
        fontSize: 11,
        fontWeight: 700,
        formatter: (p: unknown) => props.format((p as { value: number }).value),
      },
    },
  ],
}));
</script>

<template>
  <ChartCard
    :topic="topic"
    :title="title"
    :subtitle="`${subtitle}, ${year}`"
    :question="question"
    :source="source"
    :source-url="sourceUrl"
  >
    <template #actions>
      <label class="year">
        <span>{{ year }}</span>
        <input v-model.number="idx" type="range" :min="0" :max="years.length - 1" step="1" aria-label="Année" />
      </label>
    </template>
    <VChart class="chart eu" :option="option" autoresize />
    <p v-if="franceRank" class="aside">
      En {{ year }}, la France est au <strong>{{ franceRank.rank }}<sup>e</sup> rang</strong> sur
      {{ franceRank.of }} pays de l’UE {{ asidePhrase
      }}<template v-if="franceRank.rank > 1 && leader">, derrière {{ leader.label }} ({{ format(leader.value) }})</template>.
    </p>
  </ChartCard>
</template>

<style scoped>
.chart {
  width: 100%;
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
    height: 40rem;
  }
}
</style>
