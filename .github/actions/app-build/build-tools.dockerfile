FROM deps AS build

COPY *.json ./
COPY "apps/backend" "./apps/backend"
COPY "apps/tools" "./apps/tools"
COPY "packages/domain" "./packages/domain"

RUN pnpm build:tools

FROM deps AS prod

# ne garde que les deps prod
RUN pnpm install --offline --prod

# copie le build
COPY --from=build "/app/apps/backend/dist" "./apps/backend/dist"
COPY --from=build "/app/apps/tools/dist" "./apps/tools/dist"
COPY --from=build "/app/packages/domain/dist" ./packages/domain/dist

WORKDIR "/app/apps/tools"

CMD ["node", "dist/main.js"]
