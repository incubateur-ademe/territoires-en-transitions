# syntax=docker/dockerfile:1-labs
#
# Build with the repo root as context:
#   docker build -f apps/app/Dockerfile \
#     --build-arg GIT_SHORT_HASH=$(git rev-parse --short HEAD) \
#     --secret id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
#     --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
#     -t app .
#
# L'image ne contient aucune valeur spécifique à un environnement : une seule
# image par commit est promue de preprod à prod, la configuration arrive au
# démarrage du conteneur (`--env` côté Koyeb, cf. .github/workflows/cd-app.yml).
#
# Adapted from the official Next.js Docker example
# (https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile)
# for this pnpm/Nx monorepo: dependencies are declared only in the root
# package.json (per-app package.json files carry no deps), so `pnpm install`
# always runs against the full workspace.
#
# Découpage fetch / manifests / builder : voir apps/backend/Dockerfile pour le
# détail (le `pnpm fetch` initial ne dépend que du lockfile, l'install ne
# dépend que des manifests, les sources n'arrivent qu'après).
# Le cache de ces couches est exporté vers GHCR par docker-build-push.

# Épinglée par digest — cf. apps/backend/Dockerfile. Pour bumper :
# `docker buildx imagetools inspect node:24-alpine`.
ARG NODE_IMAGE=node:24.21.0-alpine@sha256:be80f76cf40ec8e42b9bec49f60a55e0660f30af58d3e5a25530785b30ea67e2
ARG PNPM_VERSION=9.15.5

FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
# https://github.com/nodejs/docker-node/tree/main#nodealpine — required for
# native addons (sharp, @swc/core) to run correctly on musl libc.
RUN apk add --no-cache libc6-compat
WORKDIR /workspace
ENV CI=true
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# The @bryntum scope is a private registry (see .npmrc); the token is only
# needed for these layers and must never land in an image layer or its history.
FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm fetch

FROM fetch AS builder
COPY --parents package.json apps/*/package.json packages/*/package.json e2e/package.json ./
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm install -r --offline --frozen-lockfile

COPY . .

# Aucune variable NEXT_PUBLIC_* ici : Next les inline dans le bundle client au
# moment du `next build`, ce qui lierait l'image à un environnement. Les valeurs
# sont lues au runtime et publiées dans le HTML par le layout racine
# (cf. packages/api/src/public-env.ts).
# https://nextjs.org/docs/app/guides/environment-variables#runtime-environment-variables
#
# GIT_SHORT_HASH identifie le commit pour `generateBuildId`. Les variables
# GITHUB_* donnent aussi au téléversement des source maps PostHog le nom et la
# version de la release, car le contexte Docker ne contient pas le dépôt Git.
# POSTHOG_PROJECT_ID et POSTHOG_HOST ne sont pas secrets et ne sont disponibles
# que dans ce stage de build.
ARG GIT_SHORT_HASH
ARG GITHUB_ACTIONS
ARG GITHUB_SHA
ARG GITHUB_REF_NAME
ARG GITHUB_REPOSITORY
ARG GITHUB_SERVER_URL
ARG POSTHOG_PROJECT_ID
ARG POSTHOG_HOST
ENV GITHUB_ACTIONS=$GITHUB_ACTIONS \
    GITHUB_SHA=$GITHUB_SHA \
    GITHUB_REF_NAME=$GITHUB_REF_NAME \
    GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
    GITHUB_SERVER_URL=$GITHUB_SERVER_URL \
    POSTHOG_PROJECT_ID=$POSTHOG_PROJECT_ID \
    POSTHOG_HOST=$POSTHOG_HOST \
    NEXT_TELEMETRY_DISABLED=1

# Le cache distant est géré par BuildKit : aucune connexion à Nx Cloud
# (ni token Nx) n'est nécessaire dans ce build Docker.
ENV NX_NO_CLOUD=true

# SENTRY_AUTH_TOKEN and POSTHOG_API_KEY are only used by their respective build
# plugins to upload source maps; both stay out of ENV and image history. The
# bryntum secret here just silences pnpm's harmless "can't resolve
# ${BRYNTUM_ACCESS_TOKEN} in .npmrc" warning (next build doesn't re-install).
# Les caches de travail Next/Nx restent locaux au builder : ils ne doivent
# pas gonfler la couche exportée à chaque commit. Ces mounts ne sont pas
# restaurés depuis le registre sur les runners éphémères ; le cache distant
# conserve les couches de dépendances et les artefacts compilés uniquement.
RUN --mount=type=cache,id=tet-app-next,target=/workspace/apps/app/.next/cache \
    --mount=type=cache,id=tet-app-nx,target=/workspace/.nx/cache \
    --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    --mount=type=secret,id=posthog_api_key,env=POSTHOG_API_KEY \
    --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm run build:app

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Métadonnées de build, posées dans le runner comme pour apps/backend : elles
# décrivent l'artefact (commit), jamais l'environnement, et doivent rester
# lisibles au runtime (/api/version, configuration publique injectée au HTML).
ARG GIT_SHORT_HASH
ARG GIT_COMMIT_TIMESTAMP
ARG APPLICATION_VERSION
ENV GIT_SHORT_HASH=$GIT_SHORT_HASH \
    GIT_COMMIT_TIMESTAMP=$GIT_COMMIT_TIMESTAMP \
    APPLICATION_VERSION=$APPLICATION_VERSION

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /workspace/apps/app/public ./apps/app/public

# Pre-create with the right ownership: the standalone copy below won't
# include an empty .next/cache, and Next needs to write there (ISR cache).
RUN mkdir -p apps/app/.next && chown nextjs:nodejs apps/app/.next

# next.config.ts sets `output: 'standalone'`; Next detects the pnpm-lock.yaml
# at the monorepo root and nests the trimmed output under apps/app/, hence
# the apps/app/server.js path below.
# https://nextjs.org/docs/app/api-reference/config/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/app/.next/static ./apps/app/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/app/server.js"]
