<script setup lang="ts">
import { onMounted } from "vue";
import { useHealth } from "@app/useHealth";
import { useProgrammeQuery } from "@app/useProgrammeQuery";
import AppHeader from "@ui/components/AppHeader.vue";
import AppFooter from "@ui/components/AppFooter.vue";
import ModeTabs from "@ui/components/ModeTabs.vue";
import QueryForm from "@ui/components/QueryForm.vue";
import ResultPanel from "@ui/components/ResultPanel.vue";

const props = defineProps<{ initialQuestion?: string }>();

const { health, loading: healthLoading, error: healthError } = useHealth();
const {
  mode,
  query,
  loading,
  error,
  answer,
  sources,
  retrieval,
  hasResult,
  found,
  askedQuestion,
  setMode,
  submit,
} = useProgrammeQuery();

// Arrivée depuis un bouton « Que propose le programme sur ce sujet ? » : on pose la question.
onMounted(() => {
  if (props.initialQuestion && props.initialQuestion.length >= 3) {
    query.value = props.initialQuestion;
    void submit();
  }
});
</script>

<template>
  <div class="page">
    <AppHeader
      :loading="healthLoading"
      :error="healthError"
      :has-api-key="health?.hasApiKey"
    />

    <main class="wrap">
      <ModeTabs :mode="mode" @change="setMode" />

      <QueryForm
        v-model="query"
        :mode="mode"
        :loading="loading"
        @submit="submit"
      />

      <ResultPanel
        v-if="hasResult"
        :mode="mode"
        :answer="answer"
        :sources="sources"
        :retrieval="retrieval"
        :error="error"
        :found="found"
        :question="askedQuestion"
      />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.wrap {
  width: min(var(--max), calc(100% - 2rem));
  margin: -1.5rem auto 3rem;
  position: relative;
  z-index: 1;
}
</style>
