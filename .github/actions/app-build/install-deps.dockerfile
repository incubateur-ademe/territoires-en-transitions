ARG TARGETPLATFORM
ARG PLATFORM=${TARGETPLATFORM}

FROM --platform=${PLATFORM} node:24-slim AS nodebase
# `--PLATFORM=<platform>` pour forcer la plateforme cible, sinon ce sera la
# même que celle sur laquelle le build est fait

# Allow CI mode for Nx (and other tools)
ENV CI=true

# locale FR pour que les tests e2e relatifs au formatage localisés des dates et des valeurs numériques puissent passer
ENV LANG="fr_FR.UTF-8"
RUN apt-get update && apt-get install -y locales dumb-init && rm -rf /var/lib/apt/lists/* && locale-gen "${LANG}"

RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev fontconfig fonts-liberation

# pnpm install & config
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest
RUN corepack enable && corepack prepare pnpm@latest-9 --activate
RUN pnpm config set '@bryntum:registry' 'https://npm.bryntum.com'
RUN --mount=type=secret,id=BRYNTUM_ACCESS_TOKEN,env=BRYNTUM_ACCESS_TOKEN \
  pnpm config set '//npm.bryntum.com/:_authToken' "$BRYNTUM_ACCESS_TOKEN"

WORKDIR /app

FROM nodebase AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# les package.json doivent être présents pour résoudre les refs `workspace:*`
COPY apps/backend/package.json apps/backend/
COPY apps/tools/package.json apps/tools/
COPY apps/auth/package.json apps/auth/
COPY apps/app/package.json apps/app/
COPY packages/api/package.json packages/api/
COPY packages/domain/package.json packages/domain/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/pdf-components/package.json packages/pdf-components/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile
