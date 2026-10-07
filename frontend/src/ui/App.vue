<script setup lang="ts">
import { useHashRoute } from "@ui/useHashRoute";
import AboutView from "@ui/views/AboutView.vue";
import HomeView from "@ui/views/HomeView.vue";

const { route } = useHashRoute();
</script>

<template>
  <!-- KeepAlive : la question et la réponse restent affichées au retour -->
  <KeepAlive>
    <component :is="route === 'about' ? AboutView : HomeView" />
  </KeepAlive>
</template>
