<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { formatQuarter } from "@domain/economy";
import type { DebtProjection } from "@domain/economy";

const props = defineProps<{
  projection: DebtProjection;
  /** Population de la France : permet d'afficher la dette par habitant. */
  population?: { year: number; value: number } | null;
}>();

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

const value = ref(props.projection.at(Date.now()));
let raf = 0;
let timer = 0;

function tick() {
  value.value = props.projection.at(Date.now());
  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  // Animation fluide, sauf si l'utilisateur a demandé moins de mouvement.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timer = window.setInterval(() => {
      value.value = props.projection.at(Date.now());
    }, 1000);
  } else {
    raf = requestAnimationFrame(tick);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  clearInterval(timer);
});

const display = computed(() => nf.format(Math.round(value.value)));
const approxBillions = computed(() => nf.format(Math.round(value.value / 1e9)));
const perSecond = computed(() => nf.format(Math.round(props.projection.perMs * 1000)));
const perYearBn = computed(() => nf.format(Math.round(props.projection.perYear / 1e9)));
const lastBn = computed(() => nf.format(Math.round(props.projection.lastValue / 1e9)));
const perCapita = computed(() =>
  props.population ? nf.format(Math.round(value.value / props.population.value)) : null,
);
const pct = computed(() =>
  props.projection.lastPctGdp === null ? null : nf1.format(props.projection.lastPctGdp),
);
</script>

<template>
  <section class="counter" aria-labelledby="counter-title">
    <p id="counter-title" class="label">Dette publique de la France (estimation)</p>
    <p class="sr-only">Environ {{ approxBillions }} milliards d’euros.</p>
    <p class="value" aria-hidden="true">
      {{ display }}<span class="unit">&nbsp;€</span>
    </p>
    <p class="rate" aria-hidden="true">
      <span class="plus">+ {{ perSecond }} €</span> par seconde
    </p>

    <p v-if="perCapita && population" class="capita" aria-hidden="true">
      soit environ <strong>{{ perCapita }} €</strong> par habitant
      <span class="capita-note">(population au 1er janvier {{ population.year }})</span>
    </p>

    <p class="note">
      <strong>Estimation, pas une mesure en temps réel.</strong>
      Dernier chiffre publié par Eurostat : {{ lastBn }} Md€ fin
      {{ formatQuarter(projection.lastQuarter) }}<template v-if="pct">
        ({{ pct }} % du PIB)</template
      >. Il est prolongé au rythme moyen des 4 derniers trimestres (+ {{ perYearBn }} Md€
      par an).
    </p>
  </section>
</template>

<style scoped>
.counter {
  background:
    radial-gradient(600px 240px at 90% 0%, rgba(181, 169, 129, 0.2), transparent 60%),
    linear-gradient(160deg, var(--navy) 0%, var(--navy-deep) 100%);
  color: var(--white);
  border-radius: var(--radius);
  padding: 1.6rem 1.5rem 1.4rem;
  box-shadow: var(--shadow);
}

.label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold);
}

.value {
  margin: 0.6rem 0 0;
  font-size: clamp(1.45rem, 6.4vw, 3.4rem);
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.unit {
  color: var(--gold);
}

.rate {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.78);
  font-variant-numeric: tabular-nums;
}

.capita {
  margin: 0.7rem 0 0;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
}

.capita strong {
  color: var(--gold);
  font-size: 1.25rem;
}

.capita-note {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.6);
}

.plus {
  color: #ff9d8f;
  font-weight: 700;
}

.note {
  margin: 1.1rem 0 0;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.72);
}

.note strong {
  color: var(--white);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
