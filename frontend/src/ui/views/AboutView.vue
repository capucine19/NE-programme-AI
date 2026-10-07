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
        <a class="back" :href="HOME_HASH">‹ Retour aux questions</a>
        <h2>En savoir plus sur le projet</h2>

        <h3>Ce que fait cet outil</h3>
        <p>
          Il répond à vos questions sur le programme de David Lisnard en s’appuyant uniquement sur
          le contenu public du site officiel
          <a href="https://www.unenouvelleenergie.fr/" target="_blank" rel="noopener noreferrer"
            >unenouvelleenergie.fr</a
          >. Chaque affirmation renvoie à sa source : cliquez sur le numéro pour lire l’extrait et
          ouvrir la page d’origine.
        </p>

        <h3>D’où viennent les réponses</h3>
        <p>
          Seules les pages «&nbsp;Notre programme&nbsp;» et «&nbsp;Questions&nbsp;» du site
          officiel sont utilisées. Le mode «&nbsp;Chercher&nbsp;» affiche les passages tels quels ;
          le mode «&nbsp;Demander&nbsp;» en rédige une synthèse, sans autre source.
        </p>

        <h3>Vos données</h3>
        <p>
          Nous ne stockons aucune donnée. Aucun compte n’est nécessaire, aucun cookie n’est
          déposé, et vos questions comme les réponses ne sont enregistrées nulle part.
        </p>

        <h3>Mistral AI</h3>
        <p>
          La recherche et la rédaction des réponses reposent sur les modèles de
          <a href="https://mistral.ai/" target="_blank" rel="noopener noreferrer">Mistral AI</a>,
          entreprise française. Votre question leur est transmise pour produire la réponse :
          n’y indiquez pas d’informations personnelles.
        </p>

        <h3>Limites</h3>
        <p>
          Une IA peut mal résumer : vérifiez toujours la source citée. Cet outil n’est ni affilié
          au parti ni son site officiel, et le nombre de questions est limité par jour.
        </p>

        <h3>Open source</h3>
        <p>
          Le code est public sur
          <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
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
  padding: 1.5rem 1.5rem 1.7rem;
  box-shadow: var(--shadow);
  line-height: 1.65;
}

.back {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.back:hover {
  color: var(--navy);
}

h2 {
  margin: 0.9rem 0 0;
  color: var(--navy);
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.25;
}

h3 {
  margin: 1.6rem 0 0.35rem;
  color: var(--navy);
  font-size: 1rem;
  font-weight: 700;
}

p {
  margin: 0;
  color: var(--ink);
}

a {
  color: var(--navy);
  text-underline-offset: 2px;
}
</style>
