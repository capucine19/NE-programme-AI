<script setup lang="ts">
import { computed } from "vue";
import { addSeries, latestPopulation, projectAnnualFlow } from "@domain/economy";
import { useDebt } from "@app/useDebt";
import { useRates } from "@app/useRates";
import { useSpending } from "@app/useSpending";
import AppFooter from "@ui/components/AppFooter.vue";
import AppHeader from "@ui/components/AppHeader.vue";
import BudgetCharts from "@ui/components/BudgetCharts.vue";
import DataGate from "@ui/components/DataGate.vue";
import DebtCharts from "@ui/components/DebtCharts.vue";
import DebtCounter from "@ui/components/DebtCounter.vue";
import EcoSection from "@ui/components/EcoSection.vue";
import FlowCounters from "@ui/components/FlowCounters.vue";
import InterestChart from "@ui/components/InterestChart.vue";
import RatesCharts from "@ui/components/RatesCharts.vue";
import SpendingCharts from "@ui/components/SpendingCharts.vue";

const debt = useDebt();
const rates = useRates();
const spending = useSpending();

const SECTIONS = [
  { id: "dette", label: "Dette" },
  { id: "cout", label: "Coût de la dette" },
  { id: "deficit", label: "Déficit et recettes" },
  { id: "depenses", label: "Dépenses" },
  { id: "social", label: "Protection sociale" },
];

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const population = computed(() => (debt.data.value ? latestPopulation(debt.data.value) : null));

/** Compteurs « depuis le 1er janvier » : un projecteur par série, calculé une seule fois. */
const flows = computed(() => {
  const d = spending.data.value;
  if (!d) return null;
  const now = Date.now();
  try {
    return {
      spending: [
        {
          label: "Dépenses publiques",
          projection: projectAnnualFlow(d.years, d.totalEurMillions, now),
        },
      ],
      interest: [
        {
          label: "Intérêts de la dette",
          projection: projectAnnualFlow(d.years, d.interestEurMillions, now),
        },
      ],
      social: [
        {
          label: "Prestations sociales",
          projection: projectAnnualFlow(
            d.years,
            addSeries(d.socialCashEurMillions, d.socialInKindEurMillions),
            now,
          ),
        },
        {
          label: "Retraites",
          projection: projectAnnualFlow(d.cofog.years, d.cofog.oldAgeEurMillions, now),
        },
      ],
    };
  } catch {
    return null;
  }
});

function formatDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "";
}
</script>

<template>
  <div class="page">
    <AppHeader view="economie" :has-api-key="true" />

    <main class="wrap">
      <nav class="jump" aria-label="Sections de la page">
        <button v-for="s in SECTIONS" :key="s.id" type="button" @click="jump(s.id)">
          {{ s.label }}
        </button>
      </nav>

      <EcoSection
        id="dette"
        title="Dette publique"
        intro="Combien doivent les administrations publiques, ce que cela représente par habitant et comment la France se compare."
      >
        <DataGate :loading="debt.loading.value" :error="debt.error.value" :ready="!!debt.data.value && !!debt.projection.value">
          <DebtCounter :projection="debt.projection.value!" :population="population" />
          <DebtCharts :data="debt.data.value!" />
          <p class="foot">
            Données Eurostat mises à jour le {{ formatDate(debt.data.value!.eurostatUpdated) }}.
            {{ debt.data.value!.definition }}.
          </p>
        </DataGate>
      </EcoSection>

      <EcoSection
        id="cout"
        title="Le coût de la dette"
        intro="Ce que la France paie pour emprunter : le taux de l’OAT à 10 ans, son écart avec l’Allemagne et les intérêts versés chaque année."
      >
        <DataGate :loading="rates.loading.value" :error="rates.error.value" :ready="!!rates.data.value">
          <RatesCharts :data="rates.data.value!" />
          <p class="foot">
            Données Eurostat mises à jour le {{ formatDate(rates.data.value!.eurostatUpdated) }}.
            {{ rates.data.value!.definition }}. Ce sont des moyennes mensuelles, pas le taux du jour.
          </p>
        </DataGate>
        <DataGate :loading="spending.loading.value" :error="spending.error.value" :ready="!!spending.data.value">
          <FlowCounters v-if="flows" :items="flows.interest" />
          <InterestChart :data="spending.data.value!" />
        </DataGate>
      </EcoSection>

      <EcoSection
        id="deficit"
        title="Déficit et recettes"
        intro="L’écart entre ce que les administrations publiques encaissent et ce qu’elles dépensent, et d’où viennent leurs recettes."
      >
        <DataGate :loading="spending.loading.value" :error="spending.error.value" :ready="!!spending.data.value">
          <BudgetCharts :data="spending.data.value!" />
        </DataGate>
      </EcoSection>

      <EcoSection
        id="depenses"
        title="Dépenses publiques"
        intro="Le total des dépenses des administrations publiques, leur répartition par fonction et la comparaison européenne."
      >
        <DataGate :loading="spending.loading.value" :error="spending.error.value" :ready="!!spending.data.value">
          <FlowCounters v-if="flows" :items="flows.spending" />
          <SpendingCharts :data="spending.data.value!" part="spending" />
        </DataGate>
      </EcoSection>

      <EcoSection
        id="social"
        title="Protection sociale"
        intro="Les prestations sociales (en espèces et en nature) et les dépenses de retraite."
      >
        <DataGate :loading="spending.loading.value" :error="spending.error.value" :ready="!!spending.data.value">
          <FlowCounters v-if="flows" :items="flows.social" />
          <SpendingCharts :data="spending.data.value!" part="social" />
          <p class="foot">
            Données annuelles Eurostat (administrations publiques) mises à jour le
            {{ formatDate(spending.data.value!.eurostatUpdated) }}. Les compteurs sont des
            estimations, pas des mesures en temps réel.
          </p>
        </DataGate>
      </EcoSection>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.wrap {
  width: min(64rem, calc(100% - 2rem));
  margin: -1.5rem auto 3rem;
  position: relative;
  z-index: 1;
  display: grid;
  gap: 2.5rem;
}

/* Barre de sections, collée en haut de l'écran pendant le défilement */
.jump {
  position: sticky;
  top: 0.6rem;
  z-index: 5;
  display: flex;
  gap: 0.35rem;
  padding: 0.35rem;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow);
  scrollbar-width: none;
}

.jump::-webkit-scrollbar {
  display: none;
}

.jump button {
  flex: none;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.jump button:hover {
  background: var(--navy);
  color: var(--white);
}

.foot {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
