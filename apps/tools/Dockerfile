# syntax=docker/dockerfile:1-labs
#
# Build with the repo root as context:
#   docker build -f apps/tools/Dockerfile \
#     --build-arg GIT_SHORT_HASH=... --build-arg GIT_COMMIT_TIMESTAMP=... \
#     --build-arg APPLICATION_VERSION=... \
#     --secret id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
#     -t tools .
#
# See apps/backend/Dockerfile for the general rationale (single root
# package.json, workspace packages need their compiled dist copied in, et le
# découpage fetch / manifests / builder qui garde la couche d'install en
# cache).
# `tools` re-uses part of the backend's compiled output directly (it imports
# from `@tet/backend/*`) but never touches `canvas`, `@tet/design-tokens` or
# `@tet/pdf-components` at runtime, so this image skips the native
# cairo/pango toolchain and the locale setup that apps/backend/Dockerfile
# needs.
#
# Kept on the same Debian base as apps/backend/Dockerfile (not Alpine): the
# production node_modules is still installed from the single root
# package.json, so it still pulls in sharp/canvas/argon2 as optional native
# deps — resolving those against a different libc family than what's tested
# in this repo would be an unforced risk for no real size gain here.

ARG NODE_IMAGE=node:24.21.0-slim@sha256:2fe369e969550cde8e867afc3fe370b260140cab4a23d467074295b42163d553
ARG PNPM_VERSION=9.15.5

FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
WORKDIR /workspace
ENV CI=true
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm fetch

FROM fetch AS manifests
COPY --parents package.json apps/*/package.json packages/*/package.json e2e/package.json ./

FROM manifests AS deps-prod
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm install -r --offline --frozen-lockfile --prod

FROM manifests AS builder
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm install -r --offline --frozen-lockfile
COPY . .
# `nx build tools` (aliased by this script) also builds the workspace
# packages it depends on, i.e. domain. `backend` itself is built too since
# tools imports its compiled output directly.
# The secret mount here just silences pnpm's harmless "can't resolve
# ${BRYNTUM_ACCESS_TOKEN} in .npmrc" warning (nx doesn't re-install).
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm run build:tools

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

# Seul apt-get de cette image (contrairement à apps/backend/Dockerfile, pas de
# libs natives ni de locale ici) : `tools` tourne des workers BullMQ, et sans
# init en PID 1 les processus enfants éventuels ne sont jamais récoltés. Même
# ENTRYPOINT que le backend pour que les deux apps Nest s'arrêtent pareil.
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3000 \
    APPLICATION_NAME=automation

ARG GIT_SHORT_HASH
ARG GIT_COMMIT_TIMESTAMP
ARG APPLICATION_VERSION
ENV GIT_COMMIT_SHORT_SHA=$GIT_SHORT_HASH \
    GIT_COMMIT_TIMESTAMP=$GIT_COMMIT_TIMESTAMP \
    APPLICATION_VERSION=$APPLICATION_VERSION

COPY --from=deps-prod --chown=node:node /workspace/node_modules ./node_modules
COPY --from=builder --chown=node:node /workspace/apps/tools/dist ./dist
COPY --from=builder --chown=node:node /workspace/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=node:node /workspace/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=node:node /workspace/packages/domain/package.json ./packages/domain/package.json
COPY --from=builder --chown=node:node /workspace/packages/domain/dist ./packages/domain/dist
# node_modules/@tet/{design-tokens,pdf-components} sont des liens symboliques
# vers packages/*/ créés par l'install workspace. Sans ces deux package.json
# ils pointent dans le vide : `tools` ne les importe pas aujourd'hui (il ne
# tire de `@tet/backend` que des types, effacés à la compilation), mais le
# jour où un import runtime remonte jusqu'à `fiche-action-pdf-export` ou
# `utils/echarts/`, ça planterait au bootstrap Nest sur un MODULE_NOT_FOUND.
# `nx build tools` ne construit pas leur dist (elles ne sont pas dans son
# graphe de dépendances) : on rétablit ici leurs package.json. La résolution
# complète (dist inclus) viendra avec le passage à des `dependencies` par app
# + `pnpm deploy --filter`.
COPY --from=builder --chown=node:node /workspace/packages/design-tokens/package.json ./packages/design-tokens/package.json
COPY --from=builder --chown=node:node /workspace/packages/pdf-components/package.json ./packages/pdf-components/package.json

USER node

EXPOSE ${PORT}

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
