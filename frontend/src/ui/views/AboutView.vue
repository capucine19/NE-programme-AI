<script setup lang="ts">
import { computed } from "vue";
import { useHealth } from "@app/useHealth";
import AppFooter from "@ui/components/AppFooter.vue";
import AppHeader from "@ui/components/AppHeader.vue";
import { GITHUB_URL, HOME_HASH } from "@ui/siteLinks";

const { health, loading, error } = useHealth();

const passages = computed(() =>
  health.value?.chunks ? `${health.value.chunks} passages` : "l’ensemble des passages",
);

// Extrait réel du corpus, pour montrer une réponse sourcée
const EXAMPLE_URL = "https://www.unenouvelleenergie.fr/questions/quel-candidat-veut-baisser-les-impots/";
</script>

<template>
  <div class="page">
    <AppHeader :loading="loading" :error="error" :has-api-key="health?.hasApiKey" />

    <main class="wrap">
      <article class="sheet">
        <a class="back" :href="HOME_HASH">Retour aux questions</a>

        <h2 class="title">En savoir plus sur le projet</h2>
        <p class="lead">
          Un outil citoyen pour interroger le programme de David Lisnard et vérifier chaque
          réponse à sa source, sur le site officiel.
        </p>

        <!-- Exemple : l'élément central de la page -->
        <figure class="example" aria-label="Exemple de réponse sourcée">
          <p class="example-answer">
            Il propose de « ramener l’impôt sur les sociétés à 20 % » et d’alléger les impôts de
            production<span class="pill" aria-hidden="true">1</span>.
          </p>
          <div class="example-source">
            <p class="example-title">
              <span class="badge">1</span>Quel candidat veut baisser les impôts ?
            </p>
            <p class="example-excerpt">
              « Alléger les impôts de production, ramener l’impôt sur les sociétés à 20 % avec une
              part variable laissée aux collectivités locales entre 0 et 5 % »
            </p>
            <a :href="EXAMPLE_URL" target="_blank" rel="noopener noreferrer">
              Voir sur le site officiel
            </a>
          </div>
          <figcaption>Chaque affirmation renvoie à l’extrait du programme dont elle est tirée.</figcaption>
        </figure>

        <section>
          <h3>Ce qui se passe quand vous posez une question</h3>
          <ol class="steps">
            <li>
              <strong>Recherche</strong>
              <p>
                L’outil retrouve, parmi {{ passages }} du programme officiel, ceux qui traitent
                de votre sujet.
              </p>
            </li>
            <li>
              <strong>Rédaction</strong>
              <p>
                Mistral AI rédige une réponse à partir de ces seuls passages. Si aucun ne répond,
                il l’indique au lieu d’inventer.
              </p>
            </li>
            <li>
              <strong>Vérification</strong>
              <p>
                Cliquez sur une pastille pour lire l’extrait cité et ouvrir la page d’origine.
              </p>
            </li>
          </ol>
        </section>

        <section>
          <h3>Deux façons de l’utiliser</h3>
          <div class="modes">
            <div>
              <strong>Demander</strong>
              <p>Une réponse rédigée et sourcée, pour comprendre une position en quelques lignes.</p>
            </div>
            <div>
              <strong>Chercher</strong>
              <p>Les passages du programme tels quels, sans reformulation, pour lire le texte exact.</p>
            </div>
          </div>
        </section>

        <section>
          <h3>Nos engagements</h3>
          <dl class="pledges">
            <div>
              <dt>Nous ne stockons aucune donnée</dt>
              <dd>
                Aucun compte, aucun cookie, aucun historique : vos questions ne sont enregistrées
                nulle part.
              </dd>
            </div>
            <div>
              <dt>Une seule source</dt>
              <dd>
                Les pages « Notre programme » et « Questions » de
                <a href="https://www.unenouvelleenergie.fr/" target="_blank" rel="noopener noreferrer"
                  >unenouvelleenergie.fr</a
                >, rien d’autre.
              </dd>
            </div>
            <div>
              <dt>Indépendant</dt>
              <dd>Un outil citoyen, ni affilié au parti, ni son site officiel.</dd>
            </div>
            <div>
              <dt>Open source</dt>
              <dd>Le code est public : chacun peut vérifier comment les réponses sont produites.</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3>Bon à savoir</h3>
          <p class="note">
            Pour rédiger la réponse, votre question est transmise à
            <a href="https://mistral.ai/" target="_blank" rel="noopener noreferrer">Mistral AI</a>,
            entreprise française, selon sa propre politique de confidentialité : n’y indiquez pas
            d’informations personnelles. Une IA peut mal résumer, alors vérifiez toujours la source
            citée. Le nombre de questions est limité par personne et par jour.
          </p>
        </section>

        <footer class="end">
          <a class="github" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            Voir le code sur GitHub
          </a>
          <a class="ask" :href="HOME_HASH">Poser une question</a>
        </footer>
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

.sheet {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem 1.4rem 1.6rem;
  line-height: 1.6;
}

a {
  color: var(--navy);
  text-underline-offset: 2px;
}

a:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  border-radius: 2px;
}

.back {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.back::before {
  content: "‹ ";
}

.back:hover {
  color: var(--navy);
}

.title {
  margin: 1rem 0 0.5rem;
  color: var(--navy);
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.lead {
  margin: 0;
  max-width: 34rem;
  color: var(--muted);
  font-size: 1.05rem;
}

/* --- Exemple de réponse sourcée ------------------------------------------- */
.example {
  margin: 1.6rem 0 0;
  padding: 1.2rem 1.2rem 1rem;
  border-radius: var(--radius);
  background: var(--bg);
}

.example-answer {
  margin: 0;
  color: var(--ink);
  font-size: 1.08rem;
  font-weight: 500;
  line-height: 1.55;
}

.pill {
  display: inline-block;
  min-width: 1.15rem;
  height: 1.15rem;
  margin-left: 0.15rem;
  padding: 0 0.28rem;
  border-radius: var(--radius-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.15rem;
  text-align: center;
  vertical-align: 0.3em;
}

.example-source {
  position: relative;
  margin: 0.9rem 0 0;
  max-width: 24rem;
  padding: 0.75rem 0.9rem 0.8rem;
  background: var(--card);
  border: 1px solid var(--line);
  border-top: 3px solid var(--gold);
  border-radius: var(--radius);
  font-size: 0.82rem;
  line-height: 1.45;
}

.example-title {
  margin: 0;
  color: var(--navy);
  font-weight: 700;
}

.badge {
  display: inline-block;
  min-width: 1.3rem;
  margin-right: 0.45rem;
  border-radius: var(--radius-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 0.72rem;
  line-height: 1.3rem;
  text-align: center;
}

.example-excerpt {
  margin: 0.45rem 0 0.55rem;
  color: var(--ink);
  font-style: italic;
}

.example-source a {
  font-size: 0.78rem;
  font-weight: 700;
}

.example figcaption {
  margin-top: 0.85rem;
  color: var(--muted);
  font-size: 0.8rem;
}

/* --- Sections -------------------------------------------------------------- */
section {
  margin-top: 2rem;
}

h3 {
  margin: 0 0 0.8rem;
  color: var(--navy);
  font-size: 1.05rem;
  font-weight: 700;
}

p,
dl,
dd {
  margin: 0;
}

strong,
dt {
  color: var(--navy);
  font-weight: 700;
}

/* Étapes : une vraie séquence, d'où la numérotation */
.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.steps li {
  position: relative;
  padding: 0 0 1.1rem 2.6rem;
  counter-increment: step;
}

.steps li::before {
  content: counter(step);
  position: absolute;
  top: 0.05rem;
  left: 0;
  width: 1.7rem;
  height: 1.7rem;
  border: 1.5px solid var(--navy);
  border-radius: 50%;
  color: var(--navy);
  font-size: 0.8rem;
  font-weight: 800;
  line-height: calc(1.7rem - 3px);
  text-align: center;
  background: var(--card);
}

.steps li:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 1.85rem;
  bottom: 0.1rem;
  left: calc(0.85rem - 0.75px);
  width: 1.5px;
  background: var(--line);
}

.steps li:last-child {
  padding-bottom: 0;
}

.steps p,
.modes p,
dd {
  color: var(--muted);
  font-size: 0.92rem;
}

.modes {
  display: grid;
  gap: 1rem;
}

.modes > div {
  padding-left: 0.9rem;
  border-left: 3px solid var(--gold);
}

.pledges {
  display: grid;
  gap: 1.1rem 1.6rem;
}

.note {
  color: var(--muted);
  font-size: 0.92rem;
}

/* --- Fin de page ----------------------------------------------------------- */
.end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.4rem;
  margin-top: 2rem;
  padding-top: 1.4rem;
  border-top: 1px solid var(--line);
}

.github {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-pill);
  background: var(--navy);
  color: var(--white);
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}

.github:hover {
  background: var(--navy-soft);
}

.ask {
  font-size: 0.85rem;
  font-weight: 700;
}

@media (min-width: 640px) {
  .sheet {
    padding: 2rem 2.2rem 2.1rem;
  }

  .title {
    font-size: 1.85rem;
  }

  .modes,
  .pledges {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
