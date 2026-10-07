<script setup lang="ts">
defineProps<{
  id: string;
  title: string;
  /** Une phrase qui dit ce que la section montre. */
  intro?: string;
}>();
</script>

<template>
  <section :id="id" class="block" :aria-labelledby="`${id}-title`">
    <header class="head">
      <h2 :id="`${id}-title`">{{ title }}</h2>
      <p v-if="intro" class="intro">{{ intro }}</p>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.block {
  display: grid;
  gap: 1.25rem;
  /* Laisse la place de la barre de sections collée en haut lors d'un saut d'ancre */
  scroll-margin-top: 4.5rem;
}

.head {
  background: var(--card);
  border-radius: var(--radius);
  border-bottom: 3px solid var(--gold);
  box-shadow: var(--shadow);
  padding: 0.85rem 1.1rem 0.95rem;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--navy);
}

.intro {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
