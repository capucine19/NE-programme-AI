<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";
import HomeView from "@ui/views/HomeView.vue";

// Chargé à la demande : ECharts n'alourdit pas la page d'accueil.
const EconomyView = defineAsyncComponent(() => import("@ui/views/EconomyView.vue"));

const isEconomy = ref(false);
/** Question transmise par un lien « #/?q=… » (boutons sous les graphiques). */
const initialQuestion = ref("");

function sync() {
  const hash = window.location.hash;
  isEconomy.value = hash.startsWith("#/economie");
  const q = new URLSearchParams(hash.split("?")[1] ?? "").get("q") ?? "";
  initialQuestion.value = isEconomy.value ? "" : q.trim().slice(0, 1000);
  if (initialQuestion.value) {
    // Évite de relancer la question (donc un appel Mistral) au rechargement de la page.
    history.replaceState(null, "", "#/");
  }
  window.scrollTo({ top: 0 });
}

sync();
onMounted(() => window.addEventListener("hashchange", sync));
onBeforeUnmount(() => window.removeEventListener("hashchange", sync));
</script>

<template>
  <EconomyView v-if="isEconomy" />
  <HomeView v-else :key="initialQuestion" :initial-question="initialQuestion" />
</template>
