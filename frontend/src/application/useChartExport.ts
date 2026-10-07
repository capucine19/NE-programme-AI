import { onBeforeUnmount, ref, type Ref } from "vue";
import { buildChartPostText, chartFileName, type ChartImageSpec } from "@domain/chartExport";
import { captureChart, renderChartImage } from "@infra/canvas/renderChartImage";

type ChartSpec = Omit<ChartImageSpec, "siteHost">;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

/** Export d'un graphique en image PNG (titre, graphique, source, adresse du site) et partage sur X. */
export function useChartExport(root: Ref<HTMLElement | null>, spec: () => ChartSpec) {
  const exporting = ref(false);
  const status = ref<string | null>(null);
  const fallbackLink = ref<string | null>(null);
  let timer = 0;

  function say(message: string, keep = false) {
    status.value = message;
    clearTimeout(timer);
    if (!keep) timer = window.setTimeout(() => (status.value = null), 6000);
  }

  onBeforeUnmount(() => clearTimeout(timer));

  async function render(current: ChartSpec): Promise<Blob> {
    if (!root.value) throw new Error("Graphique introuvable.");
    const chart = await captureChart(root.value);
    return renderChartImage({ ...current, siteHost: window.location.host }, chart);
  }

  /** Partage natif (mobile) : renvoie false si indisponible ou refusé. */
  async function nativeShare(blob: Blob, name: string, current: ChartSpec, text?: string) {
    const file = new File([blob], name, { type: "image/png" });
    if (!isTouch() || !navigator.canShare?.({ files: [file] })) return false;
    try {
      await navigator.share({ files: [file], title: current.title, ...(text ? { text } : {}) });
      return true;
    } catch (e) {
      // Fermeture de la feuille de partage par l'utilisateur : rien d'autre à faire
      return e instanceof DOMException && e.name === "AbortError";
    }
  }

  async function exportImage() {
    if (exporting.value) return;
    exporting.value = true;
    status.value = null;
    fallbackLink.value = null;
    try {
      const current = spec();
      const blob = await render(current);
      const name = chartFileName(current.title);
      if (await nativeShare(blob, name, current)) return;
      download(blob, name);
      say("Image téléchargée.");
    } catch (e) {
      say(e instanceof Error ? e.message : "Export impossible.");
    } finally {
      exporting.value = false;
    }
  }

  async function shareOnX() {
    if (exporting.value) return;
    exporting.value = true;
    status.value = null;
    fallbackLink.value = null;
    try {
      const current = spec();
      const name = chartFileName(current.title);
      const siteUrl = `${window.location.origin}/#/economie`;
      const text = buildChartPostText(current, siteUrl);
      const intent = `https://x.com/intent/tweet?${new URLSearchParams({ text })}`;
      const pending = render(current);

      // Ordinateur : X ne prend pas d'image par lien. L'écriture dans le presse-papiers et
      // l'ouverture du composeur partent directement du clic (les navigateurs l'exigent) ;
      // l'image, encore en cours de création, est fournie sous forme de promesse.
      let copied: Promise<boolean> | null = null;
      let opened: Window | null = null;
      if (!isTouch()) {
        try {
          copied = navigator.clipboard
            .write([new ClipboardItem({ "image/png": pending })])
            .then(() => true, () => false);
        } catch {
          copied = Promise.resolve(false);
        }
        // Pas de "noopener" ici : il ferait renvoyer null même quand l'onglet s'ouvre
        opened = window.open(intent, "_blank");
        if (opened) opened.opener = null;
        say("Création de l’image…", true);
      }

      const blob = await pending;
      if (copied === null) {
        // Mobile : feuille de partage native, image et texte partent ensemble
        if (await nativeShare(blob, name, current, text)) return;
        download(blob, name);
        say("Image téléchargée : ajoutez-la à votre post sur X.");
        fallbackLink.value = intent;
        return;
      }

      if (await copied) {
        say("Image copiée : collez-la (Ctrl+V / ⌘+V) dans votre post sur X.", true);
      } else {
        download(blob, name);
        say("Image téléchargée : ajoutez-la à votre post sur X.", true);
      }
      if (!opened) fallbackLink.value = intent;
    } catch (e) {
      say(e instanceof Error ? e.message : "Partage impossible.");
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, status, fallbackLink, exportImage, shareOnX };
}
