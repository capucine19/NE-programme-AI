<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T;
  options: { value: T; label: string }[];
  label: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>

<template>
  <div class="seg" role="group" :aria-label="label">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      :class="{ on: modelValue === o.value }"
      :aria-pressed="modelValue === o.value"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: inline-flex;
  padding: 0.2rem;
  border-radius: var(--radius-pill);
  background: #eef0f7;
  gap: 0.15rem;
}

.seg button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.seg button.on {
  background: var(--navy);
  color: var(--white);
}
</style>
