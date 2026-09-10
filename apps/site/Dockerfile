# syntax=docker/dockerfile:1-labs
#
# Build with the repo root as context:
#   docker build -f apps/site/Dockerfile \
#     --build-arg STRAPI_KEY=... --build-arg STRAPI_URL=... \
#     --build-arg ANON_KEY=... --build-arg API_URL=... \
#     --build-arg AXEPTIO_ID=... --build-arg APP_URL=... --build-arg PANIER_URL=... \
#     --secret id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
#     -t site .
#
# See apps/app/Dockerfile for the rationale behind this structure (adapted
# from the official Next.js Docker example for a pnpm/Nx monorepo where
# dependencies only live in the root package.json), et
# apps/backend/Dockerfile pour le découpage fetch / manifests / builder.

ARG NODE_IMAGE=node:24.21.0-alpine@sha256:be80f76cf40ec8e42b9bec49f60a55e0660f30af58d3e5a25530785b30ea67e2
ARG PNPM_VERSION=9.15.5

FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
RUN apk add --no-cache libc6-compat
WORKDIR /workspace
ENV CI=true
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS fetch
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm fetch

FROM fetch AS builder
COPY --parents package.json apps/*/package.json packages/*/package.json e2e/package.json ./
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm install -r --offline --frozen-lockfile

COPY . .

ARG STRAPI_KEY
ARG STRAPI_URL
ARG ANON_KEY
ARG API_URL
ARG AXEPTIO_ID
ARG APP_URL
ARG PANIER_URL
ARG POSTHOG_HOST
ARG POSTHOG_KEY
ARG CRISP_WEBSITE_ID

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_STRAPI_KEY=$STRAPI_KEY \
    NEXT_PUBLIC_STRAPI_URL=$STRAPI_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY \
    NEXT_PUBLIC_SUPABASE_URL=$API_URL \
    NEXT_PUBLIC_POSTHOG_HOST=$POSTHOG_HOST \
    NEXT_PUBLIC_POSTHOG_KEY=$POSTHOG_KEY \
    NEXT_PUBLIC_AXEPTIO_ID=$AXEPTIO_ID \
    NEXT_PUBLIC_CRISP_WEBSITE_ID=$CRISP_WEBSITE_ID \
    NEXT_PUBLIC_APP_URL=$APP_URL \
    NEXT_PUBLIC_PANIER_URL=$PANIER_URL

# The secret mount here just silences pnpm's harmless "can't resolve
# ${BRYNTUM_ACCESS_TOKEN} in .npmrc" warning (next build doesn't re-install).
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm run build:site

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /workspace/apps/site/public ./apps/site/public

RUN mkdir -p apps/site/.next && chown nextjs:nodejs apps/site/.next

COPY --from=builder --chown=nextjs:nodejs /workspace/apps/site/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/site/.next/static ./apps/site/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/site/server.js"]
