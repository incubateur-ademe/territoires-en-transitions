# syntax=docker/dockerfile:1
# Socle commun des conteneurs de dev des apps Node (construit par make up sous
# le nom tet-node-dev, avec l'UID/GID de l'utilisateur hôte). Tous les services
# d'apps du docker-compose (deps, nx-daemon, libs, app, site…) utilisent cette
# image telle quelle, seule leur command diffère. Le code est bind-mounté sur
# /repo et node_modules est un volume nommé peuplé par le service `deps` —
# l'image ne contient que le runtime.
FROM node:26.6.0-slim

ARG UID=1000
ARG GID=1000

# Locales FR (parité avec les images de prod Earthfile) + toolchain de
# compilation de node-canvas (pas de binaire précompilé pour Node 24),
# nécessaire au backend ; les couches étant partagées entre toutes les images
# d'apps, le surcoût n'est payé qu'une fois.
RUN apt-get update && apt-get install -y --no-install-recommends \
      locales procps git \
      python3 build-essential pkg-config \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
      fontconfig fonts-liberation \
    && sed -i 's/^# *fr_FR.UTF-8/fr_FR.UTF-8/' /etc/locale.gen && locale-gen \
    && rm -rf /var/lib/apt/lists/*
ENV LANG=fr_FR.UTF-8 LC_ALL=fr_FR.UTF-8

# pnpm épinglé sur le packageManager du repo + dotenvx global (les CMD doivent
# pouvoir déchiffrer les .env avant même que node_modules n'existe)
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate \
    && npm install -g @dotenvx/dotenvx

# Remap du user node sur l'UID/GID hôte : tout ce que le conteneur écrit sur
# les bind mounts (.next, dist, .nx…) appartient à l'utilisateur hôte
RUN if [ "$(id -u node)" != "${UID}" ] || [ "$(id -g node)" != "${GID}" ]; then \
      groupmod -o -g "${GID}" node && usermod -o -u "${UID}" -g "${GID}" node \
      && chown -R node:node /home/node; \
    fi
# Pré-création des points de montage des volumes nommés (node_modules, store
# pnpm, cache nx, état nx partagé) : sans ça docker les initialiserait root et
# pnpm install / nx échoueraient. La propriété node des volumes nommés est
# héritée d'ici au 1er montage.
RUN mkdir -p /repo/node_modules /home/node/.local/share/pnpm \
      /home/node/.nx-cache /home/node/.nx-workspace-data \
    && chown -R node:node /repo /home/node/.local /home/node/.nx-cache \
      /home/node/.nx-workspace-data
USER node
WORKDIR /repo

# Cache nx sur volume nommé persistant (/home/node/.nx-cache). Les services
# d'apps activent NX_DAEMON=true et partagent UN daemon (service nx-daemon)
# via NX_SOCKET_DIR/NX_WORKSPACE_DATA_DIRECTORY sur le volume
# nx-workspace-data — jamais le .nx/ de l'hôte (chemins/PIDs incompatibles).
# Valeur par défaut ici à false pour les usages ponctuels (docker compose run).
ENV NX_DAEMON=false NX_CACHE_DIRECTORY=/home/node/.nx-cache
