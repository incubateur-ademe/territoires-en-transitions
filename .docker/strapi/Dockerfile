# Strapi (CMS du site vitrine) — projet Node isolé du monorepo, contraint à
# Node <= 18 par ses engines. Le code est monté en volume par docker-compose ;
# `npm install` s'exécute au démarrage (node_modules en volume nommé).
FROM node:18-bookworm-slim

# Outils de build des modules natifs (better-sqlite3, sharp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
EXPOSE 1337
CMD ["sh", "-c", "npm install && npm run develop"]
