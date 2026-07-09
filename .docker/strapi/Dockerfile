# Strapi (CMS du site vitrine) — projet Node isolé du monorepo, contraint à
# Node <= 18 par ses engines. Le code est monté en volume par docker-compose ;
# `npm install` s'exécute au démarrage (node_modules en volume nommé).
FROM node:18-bookworm-slim

# Outils de build des modules natifs (better-sqlite3, sharp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

ARG UID=1000
ARG GID=1000

# Remap du user node sur l'UID/GID hôte : le code étant bind-mounté sur /app,
# tout ce que le conteneur écrit (uploads, dist, .tmp…) appartient à
# l'utilisateur hôte au lieu de root
RUN if [ "$(id -u node)" != "${UID}" ] || [ "$(id -g node)" != "${GID}" ]; then \
      groupmod -g "${GID}" node && usermod -u "${UID}" -g "${GID}" node \
      && chown -R node:node /home/node; \
    fi
# Pré-création du point de montage du volume node_modules : sans ça docker
# l'initialiserait root et npm install échouerait
RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node

WORKDIR /app
EXPOSE 1337
CMD ["sh", "-c", "npm install && npm run develop"]
