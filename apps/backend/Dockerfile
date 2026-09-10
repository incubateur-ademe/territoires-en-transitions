# syntax=docker/dockerfile:1-labs
#
# Build with the repo root as context:
#   docker build -f apps/backend/Dockerfile \
#     --build-arg GIT_SHORT_HASH=... --build-arg GIT_COMMIT_TIMESTAMP=... \
#     --build-arg APPLICATION_VERSION=... \
#     --secret id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
#     -t backend .
#
# `1-labs` (et non `1`) pour `COPY --parents`, qui permet de copier les
# manifests du workspace en conservant leur arborescence — voir l'étape
# `manifests` plus bas.
#
# NestJS has no official Docker image guide for pnpm/Nx monorepos, so this
# follows Docker's general multi-stage best practices (build tools never
# reach the final image; run as a non-root user) plus two repo specifics:
#
# - All dependencies live in the root package.json (per-app package.json
#   files carry no `dependencies`), so `pnpm install` always targets the
#   whole workspace, and the backend needs the *compiled* output of the
#   `@tet/domain`, `@tet/design-tokens` and `@tet/pdf-components` workspace
#   packages (their package.json "exports" point at dist/, not src/).
# - `canvas` needs cairo/pango/jpeg/gif/rsvg native libraries to compile,
#   and `.npmrc` sets `ignore-scripts=true` (supply-chain hardening), so its
#   postinstall never runs automatically — `pnpm rebuild canvas` after
#   install is required, same as in .github/actions/node-canvas.

# Image de base épinglée par digest : `node:24-slim` flotterait sur le
# dernier patch 24.x publié, et deux déploiements à une semaine d'écart
# pourraient partir sur des versions de Node différentes sans qu'aucun diff
# ne l'explique. Pour bumper : `docker buildx imagetools inspect node:24-slim`
# puis reporter tag + digest ici et dans les autres apps/*/Dockerfile.
ARG NODE_IMAGE=node:24.21.0-slim@sha256:2fe369e969550cde8e867afc3fe370b260140cab4a23d467074295b42163d553
# Aligné sur le champ `packageManager` de la racine (corepack prepare pnpm@9
# résoudrait le dernier 9.x du jour, encore un input non épinglé).
ARG PNPM_VERSION=9.15.5

FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
WORKDIR /workspace
ENV CI=true
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# ---- store pnpm ----
# `pnpm fetch` ne lit que le lockfile : cette couche — la seule qui accède au
# réseau — n'est invalidée que quand pnpm-lock.yaml change, jamais par une
# modification de source. C'est ce qui rend `--cache-from type=gha` utile.
#
# Un `RUN --mount=type=cache` ne suffirait pas : son contenu est local au
# builder et n'est PAS exporté par `--cache-to`. Sur des runners éphémères il
# repart vide à chaque exécution.
FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm fetch

# ---- manifests du workspace ----
# Copiés seuls, avant les sources : les deux `pnpm install` ci-dessous ne
# dépendent que d'eux, donc leur couche reste en cache tant qu'aucun
# package.json ne bouge. Copier tout le contexte avant l'install (ce que
# faisait la version précédente) faisait invalider l'install par n'importe
# quel fichier du repo — une migration SQL, un spec e2e, un README — donc un
# install complet du workspace à chaque déploiement.
FROM fetch AS manifests
COPY --parents package.json apps/*/package.json packages/*/package.json e2e/package.json ./

# ---- production node_modules (with canvas compiled) ----
# Built as its own stage so build-essential and the *-dev headers never end
# up in the final image: only the resulting node_modules/ is copied over.
FROM manifests AS deps-prod
# python3 : le script d'install de canvas est `prebuild-install -r napi ||
# node-gyp rebuild`. Sans python3, la branche de repli node-gyp ne peut pas
# s'exécuter — le jour où aucun binaire préconstruit n'est disponible (nouvel
# ABI Node, GitHub releases injoignable), le build échouerait sur un
# « Could not find any Python installation » au lieu de compiler.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential pkg-config python3 \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*
# --offline : tout est déjà dans le store depuis l'étape `fetch`, aucun accès
# réseau ici.
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm install -r --offline --frozen-lockfile --prod \
 && pnpm rebuild canvas

# ---- build (full deps, incl. @nestjs/cli / swc / typescript) ----
FROM manifests AS builder
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm install -r --offline --frozen-lockfile
COPY . .
# `nx build backend` (aliased by this script) also builds the workspace
# packages it depends on: domain, design-tokens, pdf-components.
# The secret mount here just silences pnpm's harmless "can't resolve
# ${BRYNTUM_ACCESS_TOKEN} in .npmrc" warning (nx doesn't re-install).
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm run build:backend

# ---- runtime ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

# Runtime-only shared libs for canvas (no -dev headers, no compiler) +
# fontconfig/fonts-liberation for PDF generation + the fr_FR locale used by
# date/number formatting in generated documents.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 \
      fontconfig fonts-liberation locales dumb-init \
    && sed -i '/fr_FR.UTF-8/s/^# //' /etc/locale.gen \
    && locale-gen fr_FR.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=fr_FR.UTF-8 \
    NODE_ENV=production \
    PORT=3000 \
    APPLICATION_NAME=backend

ARG GIT_SHORT_HASH
ARG GIT_COMMIT_TIMESTAMP
ARG APPLICATION_VERSION
ENV GIT_COMMIT_SHORT_SHA=$GIT_SHORT_HASH \
    GIT_COMMIT_TIMESTAMP=$GIT_COMMIT_TIMESTAMP \
    APPLICATION_VERSION=$APPLICATION_VERSION

COPY --from=deps-prod --chown=node:node /workspace/node_modules ./node_modules
COPY --from=builder --chown=node:node /workspace/apps/backend/dist ./dist
COPY --from=builder --chown=node:node /workspace/packages/domain/package.json ./packages/domain/package.json
COPY --from=builder --chown=node:node /workspace/packages/domain/dist ./packages/domain/dist
COPY --from=builder --chown=node:node /workspace/packages/design-tokens/package.json ./packages/design-tokens/package.json
COPY --from=builder --chown=node:node /workspace/packages/design-tokens/dist ./packages/design-tokens/dist
COPY --from=builder --chown=node:node /workspace/packages/pdf-components/package.json ./packages/pdf-components/package.json
COPY --from=builder --chown=node:node /workspace/packages/pdf-components/dist ./packages/pdf-components/dist
COPY --from=builder --chown=node:node /workspace/packages/pdf-components/assets ./packages/pdf-components/assets

USER node

EXPOSE ${PORT}

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
