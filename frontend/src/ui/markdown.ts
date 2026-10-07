import DOMPurify from "dompurify";
import { marked } from "marked";

// Liens des réponses (sources) : nouvel onglet, sans accès à window.opener
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const CITATION = /\[(\d{1,2})\]/g;

/**
 * Remplace les renvois « [n] » du texte par des pastilles cliquables.
 * Ne touche qu'aux nœuds texte (jamais aux attributs) et ignore les numéros
 * qui ne correspondent à aucune source.
 */
function linkCitations(html: string, sourceCount: number): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const text = node.data;
    if (!text.includes("[")) continue;

    const fragment = document.createDocumentFragment();
    let last = 0;
    for (const match of text.matchAll(CITATION)) {
      const n = Number(match[1]);
      if (n < 1 || n > sourceCount) continue;
      // « … » [2] → « … »[2] : la pastille reste collée au texte cité
      fragment.append(text.slice(last, match.index).replace(/\s+$/, ""));
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cite";
      button.dataset.cite = String(n);
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", `Source ${n}`);
      button.textContent = String(n);
      fragment.append(button);
      last = match.index + match[0].length;
    }
    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  }
  return template.innerHTML;
}

/** Markdown du LLM → HTML assaini (aucun script, aucun attribut dangereux). */
export function renderMarkdown(text: string, sourceCount = 0): string {
  const html = marked.parse(text, { async: false, gfm: true, breaks: true });
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return sourceCount > 0 ? linkCitations(clean, sourceCount) : clean;
}
