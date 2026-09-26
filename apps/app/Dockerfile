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
# Seul GIT_SHORT_HASH reste un build arg : il identifie le commit, pas
# l'environnement, et `next.config.ts` s'en sert pour `generateBuildId`.
ARG GIT_SHORT_HASH

ENV NEXT_TELEMETRY_DISABLED=1

# SENTRY_AUTH_TOKEN is only used by the Sentry build plugin to upload source
# maps; kept out of ENV so it never gets baked into the image. The bryntum
# secret here just silences pnpm's harmless "can't resolve
# ${BRYNTUM_ACCESS_TOKEN} in .npmrc" warning (next build doesn't re-install).
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
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

# Coolify prefers Dockerfile HEALTHCHECK over the UI check when both exist.
# Uses Node's built-in fetch so we don't need curl/wget in the alpine image.
HEALTHCHECK --interval=5s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/version').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/app/server.js"]
