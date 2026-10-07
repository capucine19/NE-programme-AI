# Image unique : front Vue compilé + API FastAPI.
# Le build re-scrape le site officiel et met à jour les embeddings Mistral
# (seuls les passages nouveaux ou modifiés sont recalculés).

# --- 1. Front (Vue) -----------------------------------------------------------
FROM node:22-alpine AS front
WORKDIR /front
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- 2. Corpus : scrape + embeddings ------------------------------------------
FROM python:3.13-slim AS corpus
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY scripts/ scripts/
# Corpus + embeddings versionnés : repli si le scrape échoue,
# et cache des vecteurs déjà calculés
COPY data/ data/
# Les sitemaps invalident le cache Docker dès que le site change :
# le scrape (et donc l'embedding) n'est rejoué que si le contenu a bougé.
ADD https://www.unenouvelleenergie.fr/pages-sitemap.xml /tmp/sitemaps/pages.xml
ADD https://www.unenouvelleenergie.fr/questions-sitemap.xml /tmp/sitemaps/questions.xml
RUN python scripts/scrape_programme.py \
    || echo "AVERTISSEMENT : scrape échoué, corpus versionné conservé"
# Dette publique (Eurostat, sans clé). Repli sur le data/economie.json versionné.
RUN python scripts/fetch_eurostat.py \
    || echo "AVERTISSEMENT : Eurostat injoignable, données versionnées conservées"
# Variables Railway passées au build. La clé n'est utilisée que si des
# passages ont changé ; sans clé dans ce cas, le build échoue.
ARG MISTRAL_API_KEY
ARG MISTRAL_EMBED_MODEL=mistral-embed
RUN python scripts/embed_programme.py

# --- 3. Runtime ---------------------------------------------------------------
FROM python:3.13-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ app/
COPY --from=corpus /app/data/ data/
COPY --from=front /front/dist/ frontend/dist/
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
