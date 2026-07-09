# syntax=docker/dockerfile:1
# Socle commun des images de dev des apps Node (construite par make up sous le
# nom tet-node-dev, avec l'UID/GID de l'utilisateur hôte) : les Dockerfiles
# .docker/apps/<app>/ n'ajoutent que leur CMD. Le code est bind-mounté sur /repo et
# node_modules est un volume nommé peuplé par le service compose `deps` —
# l'image ne contient que le runtime.
FROM node:24.11.1-slim

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
      groupmod -g "${GID}" node && usermod -u "${UID}" -g "${GID}" node \
      && chown -R node:node /home/node; \
    fi
# Pré-création des points de montage des volumes nommés (node_modules, store
# pnpm, cache nx) : sans ça docker les initialiserait root et pnpm install /
# nx échoueraient. .nx-cache est un volume nommé (cf. docker-compose.yml) : sa
# propriété node est héritée d'ici au 1er montage.
RUN mkdir -p /repo/node_modules /home/node/.local/share/pnpm /home/node/.nx-cache \
    && chown -R node:node /repo /home/node/.local /home/node/.nx-cache
USER node
WORKDIR /repo

# Cache nx sur volume nommé persistant (/home/node/.nx-cache). Le service `apps`
# (conteneur unique) réactive le daemon nx via NX_DAEMON=true : un seul nx pour
# toutes les apps → pas de contention inter-conteneurs. Valeur par défaut ici à
# false pour les usages ponctuels (node-base, docker compose run).
ENV NX_DAEMON=false NX_CACHE_DIRECTORY=/home/node/.nx-cache
