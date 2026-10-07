<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ProgrammeSource, QueryMode, RetrievalMode } from "@domain/models";
import { renderMarkdown } from "../markdown";
import CitationPopover from "./CitationPopover.vue";
import SharePanel from "./SharePanel.vue";
import SourceCard from "./SourceCard.vue";

const props = defineProps<{
  mode: QueryMode;
  answer: string | null;
  sources: ProgrammeSource[];
  retrieval: RetrievalMode | null;
  error: string | null;
  found: boolean;
  question: string;
}>();

const answerHtml = computed(() =>
  props.answer ? renderMarkdown(props.answer, props.sources.length) : "",
);

// --- Bulle de source ouverte depuis une pastille [n] --------------------------
const POPOVER_MAX_WIDTH = 352;
const answerWrap = ref<HTMLElement | null>(null);
const citation = ref<{ index: number; top: number; left: number; width: number } | null>(null);
let activeButton: HTMLButtonElement | null = null;

function closeCitation() {
  activeButton?.setAttribute("aria-expanded", "false");
  activeButton?.classList.remove("active");
  activeButton = null;
  citation.value = null;
}

function onAnswerClick(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button.cite");
  const wrap = answerWrap.value;
  if (!button || !wrap) return;
  const index = Number(button.dataset.cite);
  if (activeButton === button) {
    closeCitation();
    return;
  }
  closeCitation();
  const wrapRect = wrap.getBoundingClientRect();
  const rect = button.getBoundingClientRect();
  const width = Math.min(POPOVER_MAX_WIDTH, wrap.clientWidth);
  const left = Math.max(0, Math.min(rect.left - wrapRect.left - 16, wrap.clientWidth - width));
  citation.value = { index, top: rect.bottom - wrapRect.top + 6, left, width };
  activeButton = button;
  button.setAttribute("aria-expanded", "true");
  button.classList.add("active");
}

function onDocumentPointer(event: PointerEvent) {
  const target = event.target as HTMLElement;
  if (citation.value && !target.closest(".popover, button.cite")) closeCitation();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && citation.value) {
    const button = activeButton;
    closeCitation();
    button?.focus();
  }
}

watch(answerHtml, closeCitation);
onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointer);
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointer);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <section class="result" aria-live="polite">
    <h2>{{ mode === "ask" ? "Réponse" : "Résultats" }}</h2>

    <p v-if="error" class="error">{{ error }}</p>
    <div v-else-if="answer" ref="answerWrap" class="answer-wrap">
      <div class="answer" @click="onAnswerClick" v-html="answerHtml" />
      <CitationPopover
        v-if="citation && sources[citation.index - 1]"
        :index="citation.index"
        :source="sources[citation.index - 1]"
        :top="citation.top"
        :left="citation.left"
        :width="citation.width"
        @close="closeCitation"
      />
    </div>

    <p v-if="retrieval && !error" class="retrieval">
      Récupération : {{ retrieval }}
      <template v-if="mode === 'search'"> · {{ sources.length }} résultat(s)</template>
    </p>

    <SharePanel
      v-if="mode === 'ask' && found && answer && !error"
      :question="question"
      :answer="answer"
      :sources="sources"
    />

    <details v-if="sources.length && mode === 'ask'" class="used">
      <summary>Passages utilisés ({{ sources.length }})</summary>
      <ul class="sources">
        <SourceCard
          v-for="(source, i) in sources"
          :key="`${source.url}-${source.paragraph}-${i}`"
          :source="source"
          :index="i + 1"
        />
      </ul>
    </details>

    <template v-else-if="sources.length">
      <h3>Passages trouvés</h3>
      <ul class="sources">
        <SourceCard
          v-for="(source, i) in sources"
          :key="`${source.url}-${source.paragraph}-${i}`"
          :source="source"
        />
      </ul>
    </template>
  </section>
</template>

<style scoped>
.result {
  margin-top: 1.35rem;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.25rem 1.25rem 1.4rem;
  box-shadow: var(--shadow);
  animation: rise 0.35s ease both;
}

h2 {
  margin: 0 0 0.7rem;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--navy);
}

h3 {
  margin: 1.3rem 0 0.55rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 700;
}

.answer-wrap {
  position: relative;
}

.answer {
  line-height: 1.6;
  overflow-wrap: anywhere;
}

/* Pastille de renvoi [n] vers une source */
.answer :deep(.cite) {
  display: inline-block;
  min-width: 1.15rem;
  height: 1.15rem;
  margin: 0 0 0 0.15rem;
  padding: 0 0.28rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--bg);
  color: var(--navy);
  font: 700 0.66rem/1.05rem var(--font);
  vertical-align: 0.3em;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.answer :deep(.cite + .cite) {
  margin-left: 0.1rem;
}

.answer :deep(.cite:hover),
.answer :deep(.cite.active) {
  border-color: var(--navy);
  background: var(--navy);
  color: var(--white);
}

.answer :deep(.cite:focus-visible) {
  outline: 2px solid var(--gold);
  outline-offset: 1px;
}

.answer :deep(> :first-child) {
  margin-top: 0;
}

.answer :deep(> :last-child) {
  margin-bottom: 0;
}

.answer :deep(p),
.answer :deep(ul),
.answer :deep(ol),
.answer :deep(blockquote) {
  margin: 0 0 0.75rem;
}

.answer :deep(ul),
.answer :deep(ol) {
  padding-left: 1.3rem;
}

.answer :deep(li + li) {
  margin-top: 0.45rem;
}

.answer :deep(h1),
.answer :deep(h2),
.answer :deep(h3),
.answer :deep(h4) {
  margin: 1rem 0 0.5rem;
  font-size: 1rem;
  color: var(--navy);
}

.answer :deep(strong) {
  color: var(--navy);
}

.answer :deep(blockquote) {
  padding: 0.1rem 0 0.1rem 0.8rem;
  border-left: 3px solid var(--gold);
  color: var(--muted);
  font-style: italic;
}

.answer :deep(a) {
  color: var(--navy);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.error {
  margin: 0;
  color: var(--warn);
  font-weight: 600;
}

.retrieval {
  margin: 0.9rem 0 0;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.used {
  margin-top: 1.2rem;
  border-top: 1px solid var(--line);
  padding-top: 0.8rem;
}

.used summary {
  cursor: pointer;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 700;
}

.used summary:hover {
  color: var(--navy);
}

.used[open] summary {
  margin-bottom: 0.7rem;
}

.sources {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.9rem;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
