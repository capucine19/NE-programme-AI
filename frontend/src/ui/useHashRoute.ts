import { onBeforeUnmount, onMounted, ref } from "vue";
import { ABOUT_HASH } from "./siteLinks";

export type Route = "home" | "about";

function current(): Route {
  return window.location.hash === ABOUT_HASH ? "about" : "home";
}

/** Navigation minimale par hash (#/a-propos), sans routeur. */
export function useHashRoute() {
  const route = ref<Route>(current());

  function onHashChange() {
    route.value = current();
    window.scrollTo({ top: 0 });
  }

  onMounted(() => window.addEventListener("hashchange", onHashChange));
  onBeforeUnmount(() => window.removeEventListener("hashchange", onHashChange));

  return { route };
}
