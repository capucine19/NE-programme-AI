import { onMounted, ref } from "vue";
import type { SpendingData } from "@domain/economy";
import { economyRepository } from "@infra/container";

export function useSpending() {
  const data = ref<SpendingData | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  onMounted(async () => {
    try {
      data.value = await economyRepository.getSpending();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Serveur injoignable.";
    } finally {
      loading.value = false;
    }
  });

  return { data, loading, error };
}
