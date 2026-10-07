<script setup lang="ts">
import { computed } from "vue";
import { addSeries, projectAnnualFlow } from "@domain/economy";
import { useDebt } from "@app/useDebt";
import { useSpending } from "@app/useSpending";
import AppFooter from "@ui/components/AppFooter.vue";
import AppHeader from "@ui/components/AppHeader.vue";
import DebtCharts from "@ui/components/DebtCharts.vue";
import DebtCounter from "@ui/components/DebtCounter.vue";
import FlowCounters from "@ui/components/FlowCounters.vue";
import SpendingCharts from "@ui/components/SpendingCharts.vue";

const debt = useDebt();
const spending = useSpending();

const flows = computed(() => {
  const d = spending.data.value;
  if (!d) return [];
  const now = Date.now();
  try {
    return [
      {
        label: "Dépenses publiques",
        projection: projectAnnualFlow(d.years, d.totalEurMillions, now),
      },
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
    ];
  } catch {
    return [];
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
      <section class="block" aria-labelledby="h-dette">
        <h2 id="h-dette" class="section">Dette publique</h2>
        <p v-if="debt.loading.value" class="msg">Chargement des données…</p>
        <p v-else-if="debt.error.value || !debt.data.value || !debt.projection.value" class="msg err">
          {{ debt.error.value ?? "Données indisponibles." }}
        </p>
        <template v-else>
          <DebtCounter :projection="debt.projection.value" />
          <DebtCharts :data="debt.data.value" />
          <p class="foot">
            Données Eurostat mises à jour le {{ formatDate(debt.data.value.eurostatUpdated) }}.
            {{ debt.data.value.definition }}.
          </p>
        </template>
      </section>

      <section class="block" aria-labelledby="h-depenses">
        <h2 id="h-depenses" class="section">Dépenses publiques et prestations sociales</h2>
        <p v-if="spending.loading.value" class="msg">Chargement des données…</p>
        <p v-else-if="spending.error.value || !spending.data.value" class="msg err">
          {{ spending.error.value ?? "Données indisponibles." }}
        </p>
        <template v-else>
          <FlowCounters v-if="flows.length" :items="flows" />
          <SpendingCharts :data="spending.data.value" />
          <p class="foot">
            Données annuelles Eurostat (administrations publiques) mises à jour le
            {{ formatDate(spending.data.value.eurostatUpdated) }}. Les compteurs sont des
            estimations, pas des mesures en temps réel.
          </p>
        </template>
      </section>
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

.block {
  display: grid;
  gap: 1.25rem;
}

.section {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--navy);
  padding-bottom: 0.5rem;
  border-bottom: 3px solid var(--gold);
}

.block:first-child .section {
  /* Le premier titre chevauche le bandeau : on le rend lisible sur fond blanc. */
  margin-top: 0;
  background: var(--card);
  padding: 0.8rem 1rem;
  border-radius: var(--radius);
  border-bottom: 3px solid var(--gold);
  box-shadow: var(--shadow);
}

.msg {
  margin: 0;
  padding: 1.2rem;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.err {
  color: var(--warn);
  font-weight: 600;
}

.foot {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
