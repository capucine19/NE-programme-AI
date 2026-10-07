<script setup lang="ts">
import { ABOUT_HASH, GITHUB_URL } from "@ui/siteLinks";
</script>

<template>
  <footer class="footer">
    <div class="inner">
      <div class="brand">
        <div class="mark" aria-hidden="true" title="France">
          <span class="stripe blue"></span>
          <span class="stripe white"></span>
          <span class="stripe red"></span>
        </div>
        <div>
          <strong>Questions sourcées</strong>
          <p>Outil open-source d’interrogation du programme officiel.</p>
        </div>
      </div>

      <div class="cols">
        <div>
          <h3>Découvrir</h3>
          <a href="https://www.unenouvelleenergie.fr/" target="_blank" rel="noopener">Site officiel</a>
          <a href="https://www.unenouvelleenergie.fr/notre-programme/" target="_blank" rel="noopener">Notre programme</a>
          <a href="https://www.unenouvelleenergie.fr/questions/" target="_blank" rel="noopener">Questions</a>
        </div>
        <div>
          <h3>À propos</h3>
          <a :href="ABOUT_HASH">En savoir plus sur le projet</a>
          <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">Code source sur GitHub</a>
          <p class="note">
            Cet outil n’est pas affilié au parti. Il cite uniquement le contenu public de Nouvelle Énergie.
          </p>
        </div>
      </div>
    </div>

    <div class="cta-bar">
      <div class="cta-inner">
        <div>
          <p class="cta-title">Source officielle</p>
          <p class="cta-sub">Vérifiez toujours sur unenouvelleenergie.fr</p>
        </div>
        <a
          class="cta-btn"
          href="https://www.unenouvelleenergie.fr/notre-programme/"
          target="_blank"
          rel="noopener"
        >
          Voir le programme →
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  background: var(--navy-deep);
  color: var(--white);
}

.inner {
  width: min(72rem, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2.5rem 0 2rem;
  display: grid;
  gap: 2rem;
}

.brand {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.mark {
  width: 3rem;
  height: 2rem;
  border-radius: 0.35rem;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid rgba(255, 255, 255, 0.25);
  flex: none;
  background: var(--white);
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

.brand strong {
  display: block;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand p,
.note {
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.88rem;
  max-width: 28rem;
}

.cols {
  display: grid;
  gap: 1.5rem;
}

.cols h3 {
  margin: 0 0 0.65rem;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold);
}

.cols a {
  display: block;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

.cols a:hover {
  color: var(--gold);
}

.cta-bar {
  background: rgba(0, 0, 0, 0.22);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cta-inner {
  width: min(72rem, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1rem 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cta-title {
  margin: 0;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.cta-sub {
  margin: 0.2rem 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  background: var(--gold);
  color: var(--navy);
  text-decoration: none;
  border-radius: var(--radius-pill);
  padding: 0.8rem 1.35rem;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cta-btn:hover {
  background: var(--gold-hover);
}

@media (min-width: 800px) {
  .inner {
    grid-template-columns: 1.2fr 1fr;
  }

  .cols {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
