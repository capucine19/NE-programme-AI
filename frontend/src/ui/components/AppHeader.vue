<script setup lang="ts">
defineProps<{
  view?: "programme" | "economie";
  hasApiKey?: boolean;
  loading?: boolean;
  error?: string | null;
}>();
</script>

<template>
  <header class="site-header">
    <div class="topbar">
      <div class="topbar-inner">
        <p class="top-left">Outil citoyen open-source</p>
        <a
          class="top-link"
          href="https://www.unenouvelleenergie.fr/notre-programme/"
          target="_blank"
          rel="noopener"
        >
          Programme officiel
        </a>
      </div>
    </div>

    <div class="nav">
      <div class="nav-inner">
        <div class="brand">
          <div class="mark" aria-hidden="true" title="France">
            <span class="stripe blue"></span>
            <span class="stripe white"></span>
            <span class="stripe red"></span>
          </div>
          <div class="brand-text">
            <strong>Nouvelle Énergie</strong>
            <span>Programme — questions sourcées</span>
          </div>
        </div>
        <nav class="nav-links" aria-label="Sections">
          <a href="#/" :class="{ on: view !== 'economie' }">Programme</a>
          <a href="#/economie" :class="{ on: view === 'economie' }">Économie</a>
        </nav>
        <p class="nav-note">Pas le site officiel du parti</p>
      </div>
    </div>

    <section v-if="view === 'economie'" class="hero">
      <div class="hero-inner">
        <p class="eyebrow">Les chiffres</p>
        <h1>L’économie de la France en données</h1>
        <p class="lede">
          Dette publique et comparaisons européennes, à partir des données ouvertes d’Eurostat.
        </p>
      </div>
    </section>

    <section v-else class="hero">
      <div class="hero-inner">
        <p class="eyebrow">Restons informés</p>
        <h1>Interrogez le programme de David Lisnard</h1>
        <p class="lede">
          Réponses uniquement à partir de
          <a href="https://www.unenouvelleenergie.fr/notre-programme/" target="_blank" rel="noopener"
            >unenouvelleenergie.fr</a
          >,
          avec citation de la page et du paragraphe.
        </p>

        <!-- Affiché seulement en cas de problème -->
        <p v-if="!loading && (error || !hasApiKey)" class="status err" aria-live="polite">
          {{ error ?? "Clé Mistral manquante (.env) : le mode « Demander » est indisponible." }}
        </p>
      </div>
    </section>
  </header>
</template>

<style scoped>
.site-header {
  color: var(--white);
}

.topbar {
  background: var(--navy-deep);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.topbar-inner,
.nav-inner,
.hero-inner {
  width: min(72rem, calc(100% - 2rem));
  margin: 0 auto;
}

.topbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 2.4rem;
}

.top-left,
.top-link {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}

.top-link:hover {
  color: var(--gold);
}

.nav {
  background: var(--white);
  color: var(--ink);
  border-bottom: 1px solid var(--line);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mark {
  width: 2.6rem;
  height: 1.75rem;
  border-radius: 0.35rem;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid rgba(26, 38, 104, 0.15);
  flex: none;
}

.stripe {
  display: block;
  height: 100%;
}

.stripe.blue {
  background: #002395;
}

.stripe.white {
  background: #ffffff;
}

.stripe.red {
  background: #ed2939;
}

.brand-text {
  display: grid;
  gap: 0.1rem;
}

.brand-text strong {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.brand-text span {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 500;
}

.nav-links {
  display: flex;
  gap: 0.35rem;
  margin-left: auto;
}

.nav-links a {
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
}

.nav-links a.on {
  background: var(--navy);
  color: var(--white);
}

.nav-note {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
}

.hero {
  background:
    radial-gradient(700px 280px at 15% 0%, rgba(181, 169, 129, 0.18), transparent 60%),
    linear-gradient(180deg, var(--navy) 0%, var(--navy-deep) 100%);
  padding: 2.75rem 0 3rem;
}

.eyebrow {
  margin: 0 0 0.55rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
}

h1 {
  margin: 0;
  max-width: 18ch;
  font-size: clamp(1.7rem, 4.5vw, 2.55rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.lede {
  margin: 1rem 0 0;
  max-width: 36rem;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1rem;
}

.lede a {
  color: var(--gold);
  font-weight: 600;
  text-decoration: none;
}

.lede a:hover {
  text-decoration: underline;
}

.status {
  margin: 1.25rem 0 0;
  display: inline-block;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.78);
}

.status.err {
  border-color: rgba(255, 160, 140, 0.45);
  color: #ffc9bc;
}

@media (max-width: 640px) {
  .nav-note {
    display: none;
  }

  /* Les onglets passent sous la marque au lieu de déborder de l'écran */
  .nav-inner {
    flex-wrap: wrap;
  }

  .brand-text span {
    display: none;
  }

  .nav-links {
    margin-left: 0;
    width: 100%;
  }

  .nav-links a {
    flex: 1;
    text-align: center;
  }

  h1 {
    max-width: none;
  }
}
</style>
