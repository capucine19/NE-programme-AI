import { onMounted, ref } from "vue";
import type { RatesData } from "@domain/economy";
import { economyRepository } from "@infra/container";

export function useRates() {
  const data = ref<RatesData | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  onMounted(async () => {
    try {
      data.value = await economyRepository.getRates();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Serveur injoignable.";
    } finally {
      loading.value = false;
    }
  });

  return { data, loading, error };
}
