<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { FlowProjection } from "@domain/economy";

export interface FlowCounterItem {
  label: string;
  projection: FlowProjection;
}

const props = defineProps<{ items: FlowCounterItem[] }>();

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

const now = ref(Date.now());
let raf = 0;
let timer = 0;

function tick() {
  now.value = Date.now();
  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timer = window.setInterval(() => (now.value = Date.now()), 1000);
  } else {
    raf = requestAnimationFrame(tick);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  clearInterval(timer);
});

function bn(euros: number): string {
  return nf.format(Math.round(euros / 1e9));
}

function growth(g: number): string {
  return `${g >= 0 ? "+" : "−"} ${nf1.format(Math.abs(g) * 100)} %`;
}
</script>

<template>
  <section class="flows" aria-label="Dépenses publiques depuis le 1er janvier (estimation)">
    <article v-for="item in props.items" :key="item.label" class="flow">
      <p class="label">{{ item.label }}</p>
      <p class="sr-only">
        Environ {{ bn(item.projection.at(now)) }} milliards d’euros depuis le 1er janvier.
      </p>
      <p class="value" aria-hidden="true">
        {{ nf.format(Math.round(item.projection.at(now))) }}<span class="unit">&nbsp;€</span>
      </p>
      <p class="rate" aria-hidden="true">
        <span class="plus">+ {{ nf.format(Math.round(item.projection.perMs * 1000)) }} €</span>
        par seconde
      </p>
      <p class="note">
        Depuis le 1er janvier {{ item.projection.year }}. Estimation : {{ bn(item.projection.lastValue) }}
        Md€ en {{ item.projection.lastYear }} (dernier chiffre Eurostat), prolongés avec la croissance de
        {{ item.projection.lastYear }} ({{ growth(item.projection.growth) }}), soit
        {{ bn(item.projection.annual) }} Md€ pour {{ item.projection.year }}.
      </p>
    </article>
  </section>
</template>

<style scoped>
.flows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 1rem;
}

.flow {
  background: var(--card);
  border: 1px solid var(--line);
  border-top: 4px solid var(--navy);
  border-radius: var(--radius);
  padding: 1.1rem 1.2rem 1rem;
  box-shadow: var(--shadow);
  container-type: inline-size;
}

.label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--navy);
}

.value {
  margin: 0.5rem 0 0;
  /* 19 caractères : la taille suit la largeur de la carte pour ne jamais déborder. */
  font-size: min(1.7rem, 7.2cqi);
  font-weight: 800;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--navy);
}

.unit {
  color: var(--gold);
}

.rate {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.plus {
  color: var(--warn);
  font-weight: 700;
}

.note {
  margin: 0.8rem 0 0;
  padding-top: 0.7rem;
  border-top: 1px solid var(--line);
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--muted);
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
