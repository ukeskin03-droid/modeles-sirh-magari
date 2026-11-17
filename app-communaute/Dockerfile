# ─────────────────────────────────────────────────────────────────────────────
# IMAGE DOCKER DE L'APPLICATION
#
# Une seule image sert toutes les communautés : chaque communauté est un conteneur
# lancé à partir de cette image, avec SON dossier de données (voir docker-compose.yml).
#
#   docker build -t communaute .
# ─────────────────────────────────────────────────────────────────────────────

# ── Étape 1 : installer les dépendances et construire l'application
FROM node:22-slim AS construction
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY src/core/config/installation.ts ./src/core/config/installation.ts
RUN npm ci
COPY . .
RUN npm run build

# ── Étape 2 : l'image finale
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
# Les données de la communauté vivent hors de l'image, dans un volume monté ici.
ENV DATA_DIR=/donnees
ENV PORT=3000
COPY --from=construction /app ./
RUN mkdir -p /donnees && chown -R node:node /donnees /app/.next
# L'application ne tourne pas avec le compte administrateur du conteneur.
USER node
VOLUME /donnees
EXPOSE 3000
# Au démarrage : mise à niveau de la base, puis lancement du serveur.
CMD ["node", "scripts/lancer.mjs", "start"]
