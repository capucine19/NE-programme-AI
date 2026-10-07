<script setup lang="ts">
import type { QueryMode } from "@domain/models";
import { SUGGESTIONS } from "../suggestions";
import BaseButton from "./BaseButton.vue";

defineProps<{
  mode: QueryMode;
  modelValue: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
}>();

function onSubmit(e: Event) {
  e.preventDefault();
  emit("submit");
}

/** Raccourci : remplit le champ et lance directement la requête. */
function pick(suggestion: string) {
  emit("update:modelValue", suggestion);
  emit("submit");
}
</script>

<template>
  <form class="form" @submit="onSubmit">
    <label for="q">
      {{ mode === "ask" ? "Votre question" : "Recherche dans le programme" }}
    </label>
    <div class="row">
      <textarea
        id="q"
        rows="3"
        maxlength="1000"
        required
        :value="modelValue"
        :placeholder="
          mode === 'ask'
            ? 'Ex. Que propose-t-il sur la sécurité ? Sur l’école ? Ou collez une critique lue sur X pour vérifier ce que dit le programme.'
            : 'Ex. police municipale, capitalisation retraite, carte scolaire…'
        "
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
      <BaseButton
        type="submit"
        variant="gold"
        :disabled="loading || modelValue.trim().length < 3"
      >
        {{
          loading
            ? mode === "ask"
              ? "Recherche…"
              : "Indexation…"
            : mode === "ask"
              ? "Demander"
              : "Chercher"
        }}
      </BaseButton>
    </div>

    <div class="suggestions">
      <p class="hint">Essayez en un clic :</p>
      <div class="chips">
        <button
          v-for="suggestion in SUGGESTIONS[mode]"
          :key="suggestion"
          type="button"
          class="chip"
          :disabled="loading"
          @click="pick(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.form {
  margin-top: 1.1rem;
  display: grid;
  gap: 0.65rem;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.2rem;
  box-shadow: var(--shadow);
}

label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--navy);
}

.row {
  display: grid;
  gap: 0.85rem;
}

textarea {
  width: 100%;
  resize: vertical;
  border: 1.5px solid var(--line);
  border-radius: 1.25rem;
  background: #fafbfe;
  color: var(--ink);
  padding: 0.95rem 1.1rem;
  line-height: 1.45;
  min-height: 6.5rem;
}

textarea::placeholder {
  color: #8b93b0;
}

.row :deep(.btn) {
  justify-self: start;
}

.suggestions {
  margin-top: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
}

.hint {
  margin: 0 0 0.55rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip {
  padding: 0.42rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--bg);
  color: var(--navy);
  font: 600 0.78rem/1.3 var(--font);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.chip:hover:not(:disabled) {
  border-color: var(--navy);
  background: var(--navy);
  color: var(--white);
}

.chip:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 1px;
}

.chip:disabled {
  opacity: 0.55;
  cursor: wait;
}
</style>
