import { computed, onMounted, ref } from "vue";
import { projectDebt } from "@domain/economy";
import type { DebtData } from "@domain/economy";
import { economyRepository } from "@infra/container";

export function useDebt() {
  const data = ref<DebtData | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const projection = computed(() => {
    if (!data.value) return null;
    try {
      return projectDebt(data.value);
    } catch {
      return null;
    }
  });

  onMounted(async () => {
    try {
      data.value = await economyRepository.getDebt();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Serveur injoignable.";
    } finally {
      loading.value = false;
    }
  });

  return { data, projection, loading, error };
}
