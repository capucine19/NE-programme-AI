# Questions sourcées sur le programme Lisnard

Outil open-source pour interroger le programme de David Lisnard **uniquement** à partir du site officiel [unenouvelleenergie.fr/notre-programme](https://www.unenouvelleenergie.fr/notre-programme/).

**Règle d’or :** chaque réponse s’appuie sur des extraits du corpus local, avec citation (page, section, paragraphe, URL). Si rien de pertinent n’est trouvé → *« Aucune réponse trouvée dans le programme officiel. »*  
Ce n’est **pas** le site officiel du parti.

Deux modes dans l’UI :
- **Demander** — RAG : recherche + réponse rédigée par Mistral avec citations
- **Chercher** — recherche seule (passages du programme, sans rédaction LLM)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Site officiel unenouvelleenergie.fr                            │
│  (/notre-programme/*  +  /questions/*)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ scrape_programme.py
                             ▼
                  data/programme.json
                             │
                             │ embed_programme.py (Mistral Embed)
                             ▼
              data/embeddings.npz  (+ meta)
                             │
                             ▼
                   app/retrieve.py (hybride)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
        /api/search                   /api/chat
     (passages seuls)            (passages → Mistral)
              │                             │
              └──────────────┬──────────────┘
                             ▼
              frontend/ (Vue 3 — clean architecture)
              Demander | Chercher
```

### Flux

1. **Scrape** (manuel) → corpus JSON sourcé  
2. **Embed** (manuel, une fois la clé dispo) → vecteurs pré-calculés  
3. **Question / recherche** → score **hybride** (mots-clés + similarité cosinus)  
4. Mode *Demander* : top passages → Mistral chat (prompt strict)  
5. Mode *Chercher* : top passages affichés tels quels  

Sans embeddings (ou sans clé), repli automatique sur la recherche lexicale seule.

---

## Page Économie

Accessible via `#/economie` (onglet « Économie » du bandeau), graphiques ECharts :

La page est organisée en cinq sections, avec une barre de sauts en haut :

1. **Dette publique** : compteur (avec la dette par habitant), évolution en Md€, en % du PIB ou
   en € par habitant, comparaison avec DE / IT / ES / zone euro.
2. **Le coût de la dette** : taux de l'OAT à 10 ans depuis 1980 (comparé à DE / IT / ES), écart
   avec l'Allemagne (spread), compteur et évolution des intérêts payés.
3. **Déficit et recettes** : solde public (avec le seuil de 3 %), recettes et dépenses en % du
   PIB, classement UE27 du déficit, répartition des recettes (cotisations, impôts).
4. **Dépenses publiques** : compteur « depuis le 1er janvier », évolution, répartition par
   fonction (COFOG, curseur d'année), classement UE27, comparaison avec les voisins.
5. **Protection sociale** : compteurs prestations sociales et retraites, prestations en
   espèces / en nature, retraites.

Sur chaque graphique :

- **« Que propose le programme sur ce sujet ? »** : bouton sous chaque graphique. Il ouvre
  `#/?q=<question>` : la page d'accueil pose la question en mode « Demander » (un appel
  Mistral, soumis aux limites habituelles) puis retire `?q=` de l'adresse.

- **Export en image** : bouton « Exporter en image » sous chaque graphique. Le PNG (2400 px de
  large) contient un slogan, le titre et le graphique (avec son unité), une **citation exacte du
  programme** (avec le titre de la page d'origine), un appel à agir qui renvoie vers ce site, la
  source des données (« Eurostat ») et la mention « visuel citoyen non officiel ». L'image ne
  nomme ni le parti ni son président. Il est rendu sur une
  instance ECharts hors écran de taille fixe : même image sur téléphone et sur ordinateur. Sur
  mobile, il ouvre la feuille de partage native.
  Les slogans et citations sont dans `frontend/src/domain/chartPromo.ts`. Chaque citation est
  copiée mot pour mot du site officiel ; `python scripts/check_promo_quotes.py` le vérifie dans
  `data/programme.json` (à relancer après un changement de texte ou un nouveau scrape).
- **Partager sur X** : même image, avec un post prérempli (titre, source, lien vers la page,
  hashtag). Sur ordinateur, l'image est copiée dans le presse-papiers et le composeur X s'ouvre :
  il suffit de coller (X n'accepte pas d'image par lien).

Données et méthode :

- **Sources** : Eurostat, sans clé API : `gov_10q_ggdebt` (dette, trimestrielle),
  `irt_lt_mcby_m` (taux à 10 ans, mensuels), `gov_10a_main` (dépenses, prestations sociales,
  intérêts, solde, recettes, annuels), `gov_10a_exp` (dépenses par fonction COFOG ;
  « retraites » = fonction vieillesse GF1002) et `demo_pjan` (population, pour la dette par
  habitant). `python scripts/fetch_eurostat.py` écrit `data/economie.json`, servi par
  `/api/economie/dette`, `/taux` et `/depenses` (le site ne dépend pas d'Eurostat à l'exécution).
- **OAT** : le taux affiché est la moyenne mensuelle du rendement à 10 ans (le taux dit de
  convergence, identique chez Eurostat et à la BCE), pas le taux du jour. Aucune source
  gratuite du taux quotidien de l'OAT n'a été trouvée sans clé d'API.
- **Compteurs** : ce n'est **pas** du temps réel, et la page l'indique. Dette : dernier chiffre
  trimestriel prolongé au rythme moyen des 4 derniers trimestres. Dépenses, prestations,
  retraites, intérêts : dernier montant annuel publié, prolongé jusqu'à l'année en cours avec la
  croissance de la dernière année, puis réparti uniformément depuis le 1er janvier.

---

## Arborescence

```
projet/
├── app/                 API FastAPI + RAG
├── data/                Corpus + embeddings
├── scripts/             Scrape + embed
└── frontend/            UI Vue 3 (clean architecture)
    ├── src/domain/
    ├── src/application/
    ├── src/infrastructure/
    └── src/ui/
```

Détail du front : voir [`frontend/README.md`](frontend/README.md).

| Fichier / dossier | Rôle |
|-------------------|------|
| `app/main.py` | API `/api/health`, `/api/search`, `/api/chat` + sert `frontend/dist` |
| `app/prompts.py` | Prompt strict pour le chat |
| `app/retrieve.py` | Recherche hybride (lexical + embeddings, RRF) |
| `scripts/scrape_programme.py` | Extraction site officiel |
| `scripts/embed_programme.py` | Embeddings `mistral-embed` |
| `frontend/src/domain/` | Modèles + ports |
| `frontend/src/application/` | Use-cases (`useHealth`, `useProgrammeQuery`) |
| `frontend/src/infrastructure/` | Client HTTP API |
| `frontend/src/ui/` | Composants Vue |

---

## Prérequis

- Python 3.11+
- Node.js 20+ (front)
- Clé API [Mistral](https://console.mistral.ai/)

---

## Lancer le projet

### 1. Backend

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # puis renseigner MISTRAL_API_KEY
```

```bash
python scripts/scrape_programme.py
python scripts/embed_programme.py   # optionnel mais recommandé
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

→ [http://127.0.0.1:5173](http://127.0.0.1:5173) (proxy `/api` → `:8000`)

### 3. Frontend (prod via FastAPI)

```bash
cd frontend
npm run build
```

Puis ouvrir [http://127.0.0.1:8000](http://127.0.0.1:8000) — FastAPI sert `frontend/dist`.

---

## Fiabilité

1. **Lexical** + **sémantique** (`mistral-embed`)  
2. **Fusion RRF** des classements  
3. Le LLM ne choisit pas les sources : il ne voit que les passages déjà sélectionnés  

---

## Licence / contenu

- **Code** : MIT (à formaliser si besoin).  
- **Contenu politique** : Nouvelle Énergie / David Lisnard — citation avec lien vers la source.
