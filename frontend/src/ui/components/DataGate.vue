<script setup lang="ts">
/** Affiche le contenu quand les données sont prêtes, sinon l'état de chargement ou l'erreur. */
defineProps<{ loading: boolean; error: string | null; ready: boolean }>();
</script>

<template>
  <p v-if="loading" class="msg">Chargement des données…</p>
  <p v-else-if="error || !ready" class="msg err">{{ error ?? "Données indisponibles." }}</p>
  <slot v-else />
</template>

<style scoped>
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
</style>
