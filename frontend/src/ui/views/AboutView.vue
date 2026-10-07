<script setup lang="ts">
import { useHealth } from "@app/useHealth";
import AppFooter from "@ui/components/AppFooter.vue";
import AppHeader from "@ui/components/AppHeader.vue";
import { GITHUB_URL, HOME_HASH } from "@ui/siteLinks";

const { health, loading, error } = useHealth();
</script>

<template>
  <div class="page">
    <AppHeader :loading="loading" :error="error" :has-api-key="health?.hasApiKey" />

    <main class="wrap">
      <article class="card">
        <a class="back" :href="HOME_HASH">← Poser une question</a>
        <h2>Comment ça marche</h2>

        <section>
          <h3>Ce que fait cet outil</h3>
          <p>
            Il répond à vos questions sur le programme de David Lisnard en s’appuyant
            <strong>uniquement</strong> sur le contenu public du site officiel
            <a href="https://www.unenouvelleenergie.fr/" target="_blank" rel="noopener noreferrer"
              >unenouvelleenergie.fr</a
            >. Chaque affirmation renvoie à sa source : cliquez sur une pastille
            <span class="pill">1</span> pour voir l’extrait et ouvrir la page d’origine.
          </p>
        </section>

        <section>
          <h3>D’où viennent les réponses</h3>
          <p>
            Les pages <em>Notre programme</em> et <em>Questions</em> du site officiel sont
            relues automatiquement et découpées en courts passages, à chaque mise à jour de l’outil.
            Aucune autre source n’est utilisée : ni actualité, ni Wikipédia, ni autres candidats.
          </p>
        </section>

        <section>
          <h3>Les deux modes</h3>
          <ol>
            <li>
              <strong>Chercher</strong> — affiche les passages du programme les plus proches de votre
              question, tels quels, sans reformulation.
            </li>
            <li>
              <strong>Demander</strong> — retrouve ces passages, puis une IA (Mistral) rédige une
              synthèse à partir de ces seuls extraits, en les citant. Si rien ne répond à la question,
              elle l’indique : « Aucune réponse trouvée dans le programme officiel. »
            </li>
          </ol>
        </section>

        <section>
          <h3>Limites</h3>
          <ul>
            <li>Une IA peut mal résumer : vérifiez toujours la source citée.</li>
            <li>L’outil n’est pas affilié au parti et n’est pas le site officiel.</li>
            <li>Le nombre de questions est limité par personne et par jour.</li>
          </ul>
        </section>

        <section>
          <h3>Open source</h3>
          <p>
            Le code est public : vous pouvez le lire, signaler un problème ou proposer une amélioration.
          </p>
          <a class="github" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            Voir le code sur GitHub
          </a>
        </section>
      </article>
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

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.4rem 1.4rem 1.6rem;
  box-shadow: var(--shadow);
  line-height: 1.6;
}

.back {
  display: inline-block;
  margin-bottom: 0.9rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
}

.back:hover {
  color: var(--navy);
}

h2 {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--navy);
}

section + section {
  margin-top: 1.25rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--line);
}

h3 {
  margin: 0 0 0.45rem;
  font-size: 0.95rem;
  color: var(--navy);
}

p,
ul,
ol {
  margin: 0;
}

ul,
ol {
  padding-left: 1.3rem;
}

li + li {
  margin-top: 0.4rem;
}

a {
  color: var(--navy);
}

.pill {
  display: inline-block;
  min-width: 1.15rem;
  padding: 0 0.28rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--bg);
  color: var(--navy);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.05rem;
  text-align: center;
  vertical-align: 0.3em;
}

.github {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
  padding: 0.7rem 1.2rem;
  border-radius: var(--radius-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
}

.github:hover {
  background: var(--navy-soft);
}
</style>
