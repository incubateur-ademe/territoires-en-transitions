FROM deps AS build

COPY *.json ./
COPY "apps/backend" "./apps/backend"
COPY "packages/domain" "./packages/domain"
COPY "packages/design-tokens" "./packages/design-tokens"
COPY "packages/pdf-components" "./packages/pdf-components"

RUN pnpm build:backend

FROM deps AS prod

# ne garde que les deps prod
RUN pnpm install --offline --prod

# copie le build
COPY --from=build "/app/apps/backend/dist" "./apps/backend/dist"
COPY --from=build "/app/packages/domain/dist" ./packages/domain/dist
COPY --from=build "/app/packages/design-tokens/dist" ./packages/design-tokens/dist
COPY --from=build "/app/packages/pdf-components/dist" ./packages/pdf-components/dist

WORKDIR "/app/apps/backend"

CMD ["node", "dist/main.js"]
