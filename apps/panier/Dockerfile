# syntax=docker/dockerfile:1-labs
#
# Build with the repo root as context:
#   docker build -f apps/panier/Dockerfile \
#     --build-arg ANON_KEY=... --build-arg API_URL=... --build-arg APP_URL=... \
#     --build-arg AXEPTIO_ID=... --build-arg BACKEND_URL=... \
#     --secret id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
#     -t panier .
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

ARG ANON_KEY
ARG API_URL
ARG APP_URL
ARG AXEPTIO_ID
ARG BACKEND_URL
ARG CRISP_WEBSITE_ID

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY \
    NEXT_PUBLIC_SUPABASE_URL=$API_URL \
    NEXT_PUBLIC_APP_URL=$APP_URL \
    NEXT_PUBLIC_AXEPTIO_ID=$AXEPTIO_ID \
    NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_CRISP_WEBSITE_ID=$CRISP_WEBSITE_ID

# The secret mount here just silences pnpm's harmless "can't resolve
# ${BRYNTUM_ACCESS_TOKEN} in .npmrc" warning (next build doesn't re-install).
RUN --mount=type=secret,id=bryntum_token,env=BRYNTUM_ACCESS_TOKEN \
    pnpm run build:panier

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /workspace/apps/panier/public ./apps/panier/public

RUN mkdir -p apps/panier/.next && chown nextjs:nodejs apps/panier/.next

COPY --from=builder --chown=nextjs:nodejs /workspace/apps/panier/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/panier/.next/static ./apps/panier/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/panier/server.js"]
