<script setup lang="ts">
import type { ProgrammeSource } from "@domain/models";

defineProps<{
  source: ProgrammeSource;
  /** Numéro du renvoi [n] dans la réponse (mode « Demander »). */
  index?: number;
}>();
</script>

<template>
  <li class="card">
    <p class="meta">
      <span v-if="index" class="badge">{{ index }}</span>
      {{ source.pageTitle }} — {{ source.section }} — paragraphe
      {{ source.paragraph }}
    </p>
    <p
      v-if="source.scoreSemantic != null || source.scoreLexical != null"
      class="scores"
    >
      <span v-if="source.scoreSemantic != null"
        >sémantique {{ source.scoreSemantic }}</span
      >
      <span v-if="source.scoreLexical != null"
        >lexical {{ source.scoreLexical }}</span
      >
    </p>
    <p class="excerpt">{{ source.excerpt }}</p>
    <a :href="source.url" target="_blank" rel="noopener"
      >Voir sur le site officiel →</a
    >
  </li>
</template>

<style scoped>
.card {
  border-top: 1px solid var(--line);
  padding-top: 0.95rem;
}

.meta,
.scores {
  margin: 0 0 0.3rem;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.badge {
  display: inline-block;
  min-width: 1.15rem;
  margin-right: 0.3rem;
  padding: 0 0.28rem;
  border-radius: var(--radius-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.15rem;
  text-align: center;
}

.scores {
  display: flex;
  gap: 0.75rem;
}

.excerpt {
  margin: 0 0 0.55rem;
  line-height: 1.5;
  color: var(--ink);
}

a {
  color: var(--navy);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: none;
}

a:hover {
  color: var(--gold);
}
</style>
