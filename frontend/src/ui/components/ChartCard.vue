<script setup lang="ts">
import { ref } from "vue";
import { useChartExport } from "@app/useChartExport";

const props = defineProps<{
  title: string;
  subtitle?: string;
  source?: string;
  sourceUrl?: string;
  /** Question posée au programme quand on clique sur le bouton « Que propose le programme ? ». */
  question?: string;
}>();

const root = ref<HTMLElement | null>(null);
const { exporting, status, fallbackLink, exportImage, shareOnX } = useChartExport(root, () => ({
  title: props.title,
  subtitle: props.subtitle,
  source: props.source,
  sourceUrl: props.sourceUrl,
}));
</script>

<template>
  <section ref="root" class="card">
    <header class="head">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="subtitle" class="sub">{{ subtitle }}</p>
      </div>
      <div class="actions"><slot name="actions" /></div>
    </header>
    <slot />
    <footer class="foot">
      <p v-if="source" class="src">
        Source :
        <a v-if="sourceUrl" :href="sourceUrl" target="_blank" rel="noopener">{{ source }}</a>
        <template v-else>{{ source }}</template>
      </p>
      <div class="btns">
        <button type="button" class="export" :disabled="exporting" @click="exportImage">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15">
            <path
              d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ exporting ? "Création…" : "Exporter en image" }}
        </button>
        <button type="button" class="export x" :disabled="exporting" @click="shareOnX">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
            <path
              fill="currentColor"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
          Partager sur X
        </button>
        <a
          v-if="question"
          class="ask"
          :href="`#/?q=${encodeURIComponent(question)}`"
          :title="question"
        >
          Que propose le programme sur ce sujet ?
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </footer>
    <p class="status" aria-live="polite">
      {{ status }}
      <a v-if="fallbackLink" :href="fallbackLink" target="_blank" rel="noopener">Ouvrir X →</a>
    </p>
  </section>
</template>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.2rem 1.2rem 1rem;
  box-shadow: var(--shadow);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

h2 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--navy);
}

.sub {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.foot {
  margin-top: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;
}

.src {
  margin: 0;
  font-size: 0.72rem;
  color: var(--muted);
}

.src a {
  color: var(--navy);
}

.btns {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.export {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.95rem;
  border: 1.5px solid var(--navy);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--navy);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  cursor: pointer;
}

.export:hover:not(:disabled) {
  background: var(--navy);
  color: var(--white);
}

.export.x {
  background: var(--navy);
  color: var(--white);
}

.export.x:hover:not(:disabled) {
  background: var(--navy-soft);
}

.export:disabled {
  opacity: 0.6;
  cursor: progress;
}

.status {
  margin: 0.4rem 0 0;
  min-height: 1em;
  font-size: 0.72rem;
  color: var(--muted);
  text-align: right;
}

.status a {
  color: var(--navy);
  font-weight: 700;
}

.ask {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.05rem;
  border-radius: var(--radius-pill);
  background: var(--gold);
  color: var(--gold-ink);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-decoration: none;
  transition: background 0.15s;
}

.ask:hover {
  background: var(--gold-hover);
}
</style>
