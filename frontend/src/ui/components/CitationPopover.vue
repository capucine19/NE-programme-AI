<script setup lang="ts">
import type { ProgrammeSource } from "@domain/models";

defineProps<{
  index: number;
  source: ProgrammeSource;
  top: number;
  left: number;
  width: number;
}>();

defineEmits<{ close: [] }>();
</script>

<template>
  <div
    class="popover"
    role="dialog"
    :aria-label="`Source ${index}`"
    :style="{ top: `${top}px`, left: `${left}px`, width: `${width}px` }"
  >
    <div class="head">
      <span class="badge">{{ index }}</span>
      <p class="title">{{ source.pageTitle }}</p>
      <button type="button" class="close" aria-label="Fermer" @click="$emit('close')">×</button>
    </div>
    <p v-if="source.section !== source.pageTitle" class="section">{{ source.section }}</p>
    <p class="excerpt">« {{ source.excerpt }} »</p>
    <a :href="source.url" target="_blank" rel="noopener noreferrer">Voir sur le site officiel →</a>
  </div>
</template>

<style scoped>
.popover {
  position: absolute;
  z-index: 10;
  padding: 0.8rem 0.9rem 0.85rem;
  background: var(--card);
  border: 1px solid var(--line);
  border-top: 3px solid var(--gold);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  font-size: 0.82rem;
  line-height: 1.45;
  animation: drop 0.16s ease both;
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.badge {
  flex: none;
  min-width: 1.3rem;
  height: 1.3rem;
  padding: 0 0.3rem;
  border-radius: var(--radius-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.3rem;
  text-align: center;
}

.title {
  flex: 1;
  margin: 0;
  color: var(--navy);
  font-weight: 700;
}

.close {
  flex: none;
  margin: -0.3rem -0.35rem 0 0;
  padding: 0 0.35rem;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.close:hover {
  color: var(--navy);
}

.section {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.76rem;
}

.excerpt {
  margin: 0.5rem 0 0.6rem;
  color: var(--ink);
  font-style: italic;
}

a {
  color: var(--navy);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
}

a:hover {
  color: var(--gold);
}

@keyframes drop {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
