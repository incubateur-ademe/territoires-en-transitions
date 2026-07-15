FROM deps AS build
ARG APP_NAME

WORKDIR /app
COPY *.json ./
COPY "apps/${APP_NAME}" "./apps/${APP_NAME}"
COPY "packages/api" "./packages/api"
COPY "packages/domain" "./packages/domain"
COPY "packages/design-tokens" "./packages/design-tokens"
COPY "packages/ui" "./packages/ui"

RUN pnpm build:${APP_NAME}

FROM node:24-alpine
ARG APP_NAME

# Check
# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Prepare the app for production
ENV NODE_ENV=production
ENV ENV_NAME=prod
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUBLIC_PATH=/app/apps/${APP_NAME}/public
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# copy standalone build output
# ref: https://nextjs.org/docs/app/api-reference/config/next-config-js/output#automatically-copying-traced-files
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone/ .
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static

# ARG est développé dans RUN, pas dans CMD exec
RUN ln -sfn "apps/${APP_NAME}/server.js" /app/server.js

USER nextjs
EXPOSE ${PORT}

CMD ["node", "server.js"]
