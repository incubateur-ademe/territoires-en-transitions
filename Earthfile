VERSION 0.8

LOCALLY
# chemins vers les modules front
ARG --global APP_DIR='./apps/app'
ARG --global BACKEND_DIR='./apps/backend'
ARG --global TOOLS_AUTOMATION_API_DIR='./apps/tools'
ARG --global SITE_DIR='./apps/site'
ARG --global AUTH_DIR='./apps/auth'
ARG --global PANIER_DIR='./apps/panier'
ARG --global DOMAIN_DIR='./packages/domain'
ARG --global UI_DIR='./packages/ui'
ARG --global API_DIR='./packages/api'
ARG --global BUSINESS_DIR='./business'
# paramètres de la base de registre des images docker générées
ARG --global REGISTRY='ghcr.io'
ARG --global REG_USER='territoiresentransitions'
ARG --global REG_TARGET=$REGISTRY/$REG_USER
# tags appliqués aux images docker générées
ARG --global ENV_NAME="dev"
ARG --global FRONT_DEPS_TAG=$(openssl dgst -sha256 -r ./pnpm-lock.yaml | head -c 7 ; echo)
ARG --global FRONT_DEPS_IMG_NAME=$REG_TARGET/front-deps:$FRONT_DEPS_TAG
ARG --global APP_TAG=$ENV_NAME-$FRONT_DEPS_TAG-$(sh ./subdirs_hash.sh $APP_DIR,$UI_DIR,$API_DIR)
ARG --global APP_IMG_NAME=$REG_TARGET/app:$APP_TAG
ARG --global APP_TEST_IMG_NAME=$REG_TARGET/app-test:$APP_TAG
ARG --global DEPLOYMENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ARG --global GIT_COMMIT_SHORT_SHA=$(git rev-parse --short HEAD)
# ARG --global GIT_COMMIT_TIMESTAMP=$(git show -s --format=%cI HEAD)
ARG --global APPLICATION_VERSION=$(git describe --tags --always)

# TODO changer le tag
ARG --global BACKEND_IMG_NAME=$REG_TARGET/backend:$ENV_NAME-$(sh ./subdirs_hash.sh $BACKEND_DIR)
ARG --global TOOLS_AUTOMATION_API_IMG_NAME=$REG_TARGET/tools:$ENV_NAME-$(sh ./subdirs_hash.sh $TOOLS_AUTOMATION_API_DIR)
ARG --global SITE_IMG_NAME=$REG_TARGET/site:$ENV_NAME-$FRONT_DEPS_TAG-$(sh ./subdirs_hash.sh $SITE_DIR,$UI_DIR,$API_DIR)
ARG --global AUTH_IMG_NAME=$REG_TARGET/auth:$ENV_NAME-$FRONT_DEPS_TAG-$(sh ./subdirs_hash.sh $AUTH_DIR,$UI_DIR,$API_DIR)
ARG --global PANIER_IMG_NAME=$REG_TARGET/panier:$ENV_NAME-$FRONT_DEPS_TAG-$(sh ./subdirs_hash.sh $PANIER_DIR,$UI_DIR,$API_DIR)
ARG --global STORYBOOK_TAG=$ENV_NAME-$FRONT_DEPS_TAG-$(sh ./subdirs_hash.sh $UI_DIR)
ARG --global STORYBOOK_IMG_NAME=$REG_TARGET/storybook:$STORYBOOK_TAG
ARG --global DL_TAG=$ENV_NAME-$(sh ./subdirs_hash.sh data_layer)
ARG --global DB_SAVE_IMG_NAME=$REG_TARGET/db-save:$DL_TAG
ARG --global DB_VOLUME_NAME=supabase_db_tet
ARG --global GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)


postgres:
    FROM postgres:15

psql-build:
    FROM +postgres
    ENTRYPOINT ["psql"]
    SAVE IMAGE psql:latest

sqitch-build:
    FROM +postgres
    RUN apt-get update
    RUN apt-get install -y curl build-essential cpanminus perl perl-doc libdbd-pg-perl postgresql-client
    RUN cpanm --quiet --notest App::Sqitch
    ENTRYPOINT ["sqitch"]
    CMD ["help"]
    SAVE IMAGE --cache-from=$REG_TARGET/sqitch:15 --push $REG_TARGET/sqitch:15

db-deploy-build:
    FROM +sqitch-build
    COPY sqitch.conf ./sqitch.conf
    COPY ./data_layer/sqitch ./data_layer/sqitch
    SAVE IMAGE --push $REG_TARGET/db-deploy:$DL_TAG

sqitch-local-build:
    # Build sqitch avec postgres 15 et les migrations
    #
    # Utilisation: se mettre sur la bonne branche puis lancer :
    # earthly +sqitch-local-build
    # docker run sqitch $sandbox status
    FROM +sqitch-build
    COPY sqitch.conf ./sqitch.conf
    COPY ./data_layer/sqitch ./data_layer/sqitch
    SAVE IMAGE sqitch

pg-tap-build:
    FROM +postgres
    RUN apt-get update
    RUN apt-get install cpanminus -y
    RUN cpanm TAP::Parser::SourceHandler::pgTAP
    ENTRYPOINT ["pg_prove"]
    SAVE IMAGE --push $REG_TARGET/pg-tap:15

db-test-build:
    FROM +pg-tap-build
    CMD ["./tests/collectivite/collectivite_test.sql"]
    COPY ./data_layer/tests ./tests
    SAVE IMAGE db-test:latest

db-test:
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +db-test-build
    RUN docker run --rm \
        --network $network \
        --env PGHOST=$(echo $DB_URL | cut -d@ -f2 | cut -d: -f1) \
        --env PGPORT=$(echo $DB_URL | cut -d: -f4 | cut -d/ -f1) \
        --env PGUSER=$(echo $DB_URL | cut -d: -f3 | cut -d@ -f1) \
        --env PGPASSWORD=$(echo $DB_URL | cut -d: -f3 | cut -d@ -f1) \
        --env PGDATABASE=$(echo $DB_URL | cut -d/ -f4) \
        db-test:latest

db-deploy:
    ARG --required DB_URL
    ARG network=host
    ARG to=@HEAD
    LOCALLY
    DO +BUILD_IF_NO_IMG --IMG_NAME=db-deploy --IMG_TAG=$DL_TAG --BUILD_TARGET=db-deploy-build
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        $REG_TARGET/db-deploy:$DL_TAG deploy --to $to --mode change

db-deploy-test:
    ARG --required DB_URL
    ARG network=host
    ARG tag=v4.0.0
    LOCALLY
    RUN earthly --use-inline-cache +db-deploy-build
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        $REG_TARGET/db-deploy:$DL_TAG deploy --mode change
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        $REG_TARGET/db-deploy:$DL_TAG revert --to @$tag --y
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        $REG_TARGET/db-deploy:$DL_TAG deploy --mode change --verify

db-sync-build:
    ARG TARGETPLATFORM
    # `--PLATFORM=<platform>` pour forcer la plateforme cible, sinon ce sera la
    # même que celle sur laquelle le build est fait
    ARG PLATFORM=$TARGETPLATFORM
    FROM --platform=$PLATFORM ankane/pgsync
    COPY ./data_layer/pgsync/.pgsync.yml ./.pgsync.yml
    COPY ./data_layer/pgsync/sync-databases.sh ./sync-databases.sh
    RUN chmod +x ./sync-databases.sh
    ENTRYPOINT ["./sync-databases.sh"]
    SAVE IMAGE --push $REG_TARGET/db-sync:$DL_TAG


db-sync:
    ARG --required FROM_DB_URL
    ARG --required TO_DB_URL
    ARG network=host
    LOCALLY
    DO +BUILD_IF_NO_IMG --IMG_NAME=db-sync --IMG_TAG=$DL_TAG --BUILD_TARGET=db-sync-build
    RUN docker run --rm \
        --network $network \
        --env FROM_DB_URL=$FROM_DB_URL \
        --env TO_DB_URL=$TO_DB_URL \
        $REG_TARGET/db-sync:$DL_TAG

db-sync-local:
    ARG --required FROM_DB_URL
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    DO +BUILD_IF_NO_IMG --IMG_NAME=db-sync --IMG_TAG=$DL_TAG --BUILD_TARGET=db-sync-build
    RUN docker run --rm \
        --network $network \
        --env FROM_DB_URL=$FROM_DB_URL \
        --env TO_DB_URL=$DB_URL \
        $REG_TARGET/db-sync:$DL_TAG

seed-build:
    FROM +postgres
    ENV SKIP_TEST_DOMAIN=0
    ENV PG_URL
    COPY ./data_layer/seed /seed
    ENTRYPOINT sh ./seed/seed.sh
    SAVE IMAGE seed:latest

seed:
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +seed-build
    RUN docker run --rm \
        --network $network \
        --env PG_URL=$DB_URL \
        seed:latest

seed-geojson:
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +seed-build
    RUN docker run --rm \
        --network $network \
        --env PG_URL=$DB_URL \
        --entrypoint sh \
        seed:latest ./seed/geojson.sh

load-json-build:
    FROM curlimages/curl:8.1.0
    ENV SERVICE_ROLE_KEY
    ENV API_URL
    COPY ./data_layer/content /content
    COPY ./data_layer/scripts/load_json_content.sh /content/load.sh
    ENTRYPOINT sh /content/load.sh
    SAVE IMAGE load-json:latest

load-json:
    ARG --required SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG network=host
    LOCALLY
    RUN earthly +load-json-build
    RUN docker run --rm \
        --network $network \
        --env API_URL=$API_URL \
        --env SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY \
        load-json:latest db-deploy --mode change

refresh-views:
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +psql-build
    RUN docker run --rm \
        --network $network \
        psql:latest $DB_URL -v ON_ERROR_STOP=1 \
        -c "refresh materialized view stats.collectivite; refresh materialized view site_labellisation;"

node-alpine:
  # Pinning the docker image version to node:20.15.1-alpine
  # because of existing memory leaks from using the fetch() API in node 20.16.0
  # https://www.reddit.com/r/node/comments/1ejzn64/sudden_inexplicable_memory_leak_on_new_builds/
  FROM node:20.15.1-alpine

  # Allow CI mode for Nx (and other tools)
  ENV CI=true

  # Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
  RUN apk add --no-cache libc6-compat
  WORKDIR /app

node-alpine-with-prod-deps:
  FROM +node-alpine

  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"

  RUN npm install -g corepack@latest
  RUN corepack enable && corepack prepare pnpm@latest-9 --activate

  ARG BRYNTUM_ACCESS_TOKEN
  RUN pnpm config set '@bryntum:registry' 'https://npm.bryntum.com'
  RUN pnpm config set '//npm.bryntum.com/:_authToken' "$BRYNTUM_ACCESS_TOKEN"

  COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

  COPY $BACKEND_DIR $BACKEND_DIR
  COPY $DOMAIN_DIR $DOMAIN_DIR

  # Uninstall node-canvas not used by the frontends.
  # Otherwise, need to add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake in the docker image to do npm install
  RUN pnpm uninstall canvas

  # RUN pnpm install -r --prod

node-alpine-with-all-deps:
  FROM +node-alpine-with-prod-deps

  RUN pnpm install --frozen-lockfile

  COPY *.json ./

  # Copy shared libraries
  COPY $API_DIR $API_DIR
  COPY $UI_DIR $UI_DIR


# construit l'image de base pour les images utilisant node
node-fr:
    ARG TARGETPLATFORM
    # `--PLATFORM=<platform>` pour forcer la plateforme cible, sinon ce sera la
    # même que celle sur laquelle le build est fait
    ARG PLATFORM=$TARGETPLATFORM
    FROM --platform=$PLATFORM node:20.15.1-slim

    # Allow CI mode for Nx (and other tools)
    ENV CI=true

    # locale FR pour que les tests e2e relatifs au formatage localisés des dates et des valeurs numériques puissent passer
    ENV LANG fr_FR.UTF-8
    RUN apt-get update && apt-get install -y locales dumb-init && rm -rf /var/lib/apt/lists/* && locale-gen "fr_FR.UTF-8"

    RUN apt-get update && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

    ENV PNPM_HOME="/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"

    RUN npm install -g corepack@latest
    RUN corepack enable && corepack prepare pnpm@latest-9 --activate

    ARG BRYNTUM_ACCESS_TOKEN
    RUN pnpm config set '@bryntum:registry' 'https://npm.bryntum.com'
    RUN pnpm config set '//npm.bryntum.com/:_authToken' "$BRYNTUM_ACCESS_TOKEN"

    WORKDIR /app

prod-deps:
    FROM +node-fr

    # `pnpm fetch` does require only lockfile
    # See https://pnpm.io/cli/fetch
    COPY pnpm-lock.yaml ./
    RUN pnpm fetch --prod

    COPY package.json ./
    RUN pnpm install -r --offline --prod

# construit l'image contenant les dépendances des modules front
front-deps:
    FROM +prod-deps

    RUN pnpm install --frozen-lockfile

    COPY *.json ./

    # Copy only shared libraries
    COPY $API_DIR $API_DIR
    COPY $UI_DIR $UI_DIR
    # Backend is also used as a shared library
    COPY $BACKEND_DIR $BACKEND_DIR
    COPY $DOMAIN_DIR $DOMAIN_DIR

# APP ENTRYPOINTS
# ---------------

app-docker:
  BUILD --pass-args ./apps/app+docker

app-test-docker:
  BUILD --pass-args ./apps/app+docker --DOCKER_IMAGE=$APP_TEST_IMG_NAME

app-deploy:
  ARG --required KOYEB_API_KEY
  BUILD --pass-args ./apps/app+deploy


# BACKEND ENTRYPOINTS
# -------------------

backend-local-seed:
  BUILD --pass-args ./apps/backend+local-seed

backend-seed:
  BUILD --pass-args ./apps/backend+seed

backend-docker:
  BUILD --pass-args ./apps/backend+docker

backend-deploy:
  ARG --required KOYEB_API_KEY
  ARG --required TRAJECTOIRE_SNBC_SHEET_ID
  ARG --required TRAJECTOIRE_SNBC_XLSX_ID
  ARG --required TRAJECTOIRE_SNBC_RESULT_FOLDER_ID
  BUILD --pass-args ./apps/backend+deploy

backend-test:
  ARG --required TRAJECTOIRE_SNBC_SHEET_ID
  ARG --required TRAJECTOIRE_SNBC_XLSX_ID
  ARG --required TRAJECTOIRE_SNBC_RESULT_FOLDER_ID
  ARG --required REFERENTIEL_TE_SHEET_ID
  ARG --required REFERENTIEL_CAE_SHEET_ID
  ARG --required REFERENTIEL_ECI_SHEET_ID
  ARG --required INDICATEUR_DEFINITIONS_SHEET_ID
  ARG --required GCLOUD_SERVICE_ACCOUNT_KEY
  ARG --required SUPABASE_DATABASE_URL
  ARG --required SUPABASE_URL
  ARG --required SUPABASE_ANON_KEY
  ARG --required SUPABASE_SERVICE_ROLE_KEY
  ARG --required SUPABASE_JWT_SECRET
  ARG --required BREVO_API_KEY
  ARG --required DIRECTUS_API_KEY
  ARG --required QUEUE_REDIS_HOST
  BUILD --pass-args ./apps/backend+test


# BACKEND ENTRYPOINTS
# -------------------

tools-docker:
    BUILD --pass-args ./apps/tools+docker

tools-deploy:
    ARG --required KOYEB_API_KEY
    BUILD --pass-args ./apps/tools+deploy

tools-test:
    BUILD --pass-args ./apps/tools+test

# PANIER ENTRYPOINTS
# ------------------

panier-docker:
  BUILD --pass-args ./apps/panier+docker

panier-deploy:
  ARG --required KOYEB_API_KEY
  BUILD --pass-args ./apps/panier+deploy

# lance l'image du panier en local
panier-run:
    ARG network=supabase_network_tet
    LOCALLY
    RUN docker run -d --rm \
        --name panier_tet \
        --network $network \
        --publish 3002:3000 \
        $PANIER_IMG_NAME



# SITE ENTRYPOINTS
# ----------------

site-docker:
  BUILD --pass-args ./apps/site+docker

site-deploy:
  ARG --required KOYEB_API_KEY
  BUILD --pass-args ./apps/site+deploy

site-run: ## construit et lance l'image du site en local
    ARG network=supabase_network_tet
    LOCALLY
    RUN docker run -d --rm \
        --name site_tet \
        --network $network \
        --publish 3001:80 \
        $SITE_IMG_NAME

app-run: ## construit et lance l'image de l'app en local
    ARG --required ANON_KEY
    ARG --required API_URL
    ARG network=supabase_network_tet
    LOCALLY
    # DO +BUILD_IF_NO_IMG --IMG_NAME=front-deps --IMG_TAG=$FRONT_DEPS_TAG --BUILD_TARGET=front-deps
    DO +BUILD_IF_NO_IMG --IMG_NAME=app --IMG_TAG=$APP_TAG --BUILD_TARGET=app-docker
    ARG kong_url=http://supabase_kong_tet:8000
    RUN docker run -d --rm \
        --name app_tet \
        --network $network \
        --publish 3000:3000 \
        $APP_IMG_NAME

app-test-build: ## construit une image pour exécuter les tests unitaires de l'app
    FROM +front-deps
    ENV NEXT_PUBLIC_SUPABASE_URL
    ENV NEXT_PUBLIC_SUPABASE_ANON_KEY

    # copie les sources du module à tester
    COPY $APP_DIR $APP_DIR

    # la commande utilisée pour lancer les tests
    CMD pnpm run test:app
    SAVE IMAGE app-test:latest

app-test: ## lance les tests unitaires de l'app
    LOCALLY
    RUN earthly +app-test-build
    RUN docker run --rm \
        --name app-test_tet \
        --env CI=true \ # désactive le mode watch quand on lance la commande en local
        --env NEXT_PUBLIC_SUPABASE_URL='http://fake' \
        --env NEXT_PUBLIC_SUPABASE_ANON_KEY='fake' \
        app-test:latest

package-api-test-build: ## construit une image pour exécuter les tests d'intégration de l'api
    FROM +front-deps
    ENV SUPABASE_URL
    ENV SUPABASE_ANON_KEY
    ENV SUPABASE_SERVICE_ROLE_KEY

    # la commande utilisée pour lancer les tests
    CMD pnpm run test:api
    SAVE IMAGE package-api-test:latest

package-api-test: ## lance les tests d'intégration de l'api
    ARG --required API_URL
    ARG --required ANON_KEY
    ARG --required SERVICE_ROLE_KEY
    ARG network=host
    LOCALLY
    RUN earthly +package-api-test-build
    RUN docker run --rm \
        --name package-api-test_tet \
        --network $network \
        --env NEXT_PUBLIC_SUPABASE_URL=$API_URL \
        --env NEXT_PUBLIC_SUPABASE_KEY=$ANON_KEY \
        --env SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY \
        package-api-test:latest


auth-build: ## construit l'image du module d'authentification
    ARG PLATFORM
    ARG --required ANON_KEY
    ARG --required API_URL
    ARG BACKEND_URL
    ARG APP_URL
    ARG vars
    FROM +front-deps
    ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
    ENV NEXT_PUBLIC_SUPABASE_URL=$API_URL
    ENV NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL
    ENV NEXT_PUBLIC_APP_URL=$APP_URL

    ENV NEXT_TELEMETRY_DISABLED=1
    ENV PUBLIC_PATH="/app/apps/auth/public"
    ENV PORT=80
    EXPOSE $PORT
    # copie les sources des modules à construire
    COPY $AUTH_DIR $AUTH_DIR

    RUN pnpm run build:auth
    CMD ["dumb-init", "./node_modules/.bin/next", "start", "./apps/auth/"]
    SAVE IMAGE --cache-from=$AUTH_IMG_NAME --push $AUTH_IMG_NAME

auth-run: ## construit et lance l'image du module d'authentification en local
    ARG network=supabase_network_tet
    LOCALLY
    RUN docker run -d --rm \
        --name auth_tet \
        --network $network \
        --publish 3003:80 \
        $AUTH_IMG_NAME

package-ui-storybook-test:
    ARG PLATFORM
    ARG PORT=6007

    FROM +front-deps
    RUN pnpm exec playwright install --with-deps chromium
    RUN pnpm nx build-storybook ui --quiet
    EXPOSE $PORT

    RUN pnpx concurrently -k -s first -n "SB,TEST" \
      "pnpx http-server $UI_DIR/storybook-static --port $PORT --silent" \
      "pnpx wait-on tcp:127.0.0.1:$PORT && pnpm nx test-storybook ui --url http://127.0.0.1:$PORT" || true


curl-test-build:
    FROM curlimages/curl:8.1.0
    USER root
    RUN apk --update add jq
    COPY ./data_layer/scripts/curl_test.sh /curl_test.sh
    ENTRYPOINT sh ./curl_test.sh
    SAVE IMAGE curl-test:latest

curl-test:
    ARG --required SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG network=supabase_network_tet
    ARG internal_url=http://supabase_kong_tet:8000
    LOCALLY
    RUN earthly +curl-test-build
    RUN docker run --rm \
        --name curl_test_tet \
        --network $network \
        --env API_KEY=$SERVICE_ROLE_KEY \
        --env URL=$internal_url \
        curl-test:latest
    RUN docker run --rm \
        --name curl_test_tet \
        --network host \
        --env API_KEY=$SERVICE_ROLE_KEY \
        --env URL=$API_URL \
        curl-test:latest

api-test-build:
    FROM denoland/deno
    ENV SUPABASE_URL
    ENV SUPABASE_KEY
    ENV SERVICE_ROLE_KEY
    WORKDIR tests
    COPY ./api_tests .
    RUN deno cache tests/base/smoke.test.ts
    RUN deno cache tests/base/utilisateur.test.ts
    CMD deno
    SAVE IMAGE api-test:latest

api-test:
    ARG --required SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG network=host
    ARG tests='base droit historique plan_action scoring indicateurs labellisation utilisateur'
    LOCALLY
    RUN earthly +api-test-build
    FOR test IN $tests
      RUN echo "Running tests for tests/$test'"
      RUN docker run --rm \
              --name api_test_tet \
              --network $network \
              --env SUPABASE_URL=$API_URL \
              --env SUPABASE_ANON_KEY=$SERVICE_ROLE_KEY \
              --env SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY \
              api-test:latest test --no-check -A tests/$test/*.test.ts --location 'http://localhost'
    END

api-crud-test:
    ARG --required ANON_KEY
    ARG --required API_URL
    ARG network=host
    LOCALLY
    RUN earthly +api-test-build
    RUN echo "Running tests crud'"
    RUN docker run --rm \
      --name api_crud_test_tet \
      --network $network \
      --env SUPABASE_URL=$API_URL \
      --env SUPABASE_ANON_KEY=$ANON_KEY \
      api-test:latest test -A tests/crud/crud.test.ts --location 'http://localhost' -- elements:axe

cypress-wip:
    FROM cypress/included:12.3.0
    ENV ELECTRON_EXTRA_LAUNCH_ARGS="--disable-gpu"
    WORKDIR /e2e
    COPY ./e2e/package.json /e2e/package.json
    RUN npm install
    COPY ./e2e/ /e2e
    RUN npm test

gen-types: ## génère le typage à partir de la base de données
    LOCALLY
    IF [ "$CI" = "true" ]
        RUN supabase gen types typescript --local --schema public --schema labellisation > $API_DIR/src/database.types.ts
    ELSE
        RUN pnpx supabase gen types typescript --local --schema public --schema labellisation > $API_DIR/src/database.types.ts
    END
    RUN cp $API_DIR/src/database.types.ts ./api_tests/lib/database.types.ts
    RUN cp $API_DIR/src/database.types.ts ./supabase/functions/_shared/database.types.ts

setup-env:
    LOCALLY
    RUN earthly +stop
    IF [ "$CI" = "true" ]
        RUN supabase start
        RUN supabase status -o env > .arg
    ELSE
        RUN pnpm install
        RUN pnpx supabase start
        RUN pnpx supabase status -o env > .arg
    END
    RUN export $(cat .arg | xargs) && sh ./make_dot_env.sh
    RUN earthly +stop

start-redis:
    LOCALLY
    RUN docker stop redis_tet || true && docker rm redis_tet || true
    RUN docker run -d --name redis_tet -p 6379:6379 redis

dev:
    LOCALLY
    ARG --required DB_URL
    ARG --required API_URL
    ARG --required ANON_KEY
    ARG --required SERVICE_ROLE_KEY
    ARG JWT_SECRET
    ARG REFERENTIEL_TE_SHEET_ID
    ARG REFERENTIEL_CAE_SHEET_ID
    ARG REFERENTIEL_ECI_SHEET_ID
    ARG INDICATEUR_DEFINITIONS_SHEET_ID
    ARG TRAJECTOIRE_SNBC_XLSX_ID
    ARG GCLOUD_SERVICE_ACCOUNT_KEY
    ARG network=host
    ARG stop=yes
    ARG datalayer=yes
    ARG app=no
    ARG auth=no
    ARG eco=no
    ARG fast=no
    ARG faster=no
    ARG version=HEAD # version du plan

    IF [ "$fast" = "yes" -a "$faster" = "yes" ]
        RUN echo "Les options fast et faster sont mutuellement exclusives"
        RUN exit 1
    END

    IF [ "$stop" = "yes" ]
        RUN earthly +stop --npx=$npx
    END

    IF [ "$datalayer" = "yes" ]
        IF [ "$fast" = "yes" ]
            RUN earthly +restore-state
        END

        IF [ "$faster" = "yes" ]
            RUN earthly +restore-db --pull=yes
        END

        IF [ "$CI" = "true" ]
            RUN supabase start
            RUN docker stop supabase_studio_tet
            RUN docker stop supabase_pg_meta_tet
        ELSE
            RUN pnpx supabase start
        END

        RUN earthly +start-redis

        IF [ "$eco" = "yes" ]
            RUN docker stop supabase_imgproxy_tet
            RUN docker stop supabase_studio_tet
            RUN docker stop supabase_pg_meta_tet
        END

        IF [ "$faster" = "no" ]
            RUN earthly +db-deploy --to @$version --DB_URL=$DB_URL

            RUN earthly +load-json --SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY --API_URL=$API_URL

            # Seed des indicateurs et des referentiels à partir des spreadsheets
            RUN earthly  +backend-seed \
                --REFERENTIEL_TE_SHEET_ID=$REFERENTIEL_TE_SHEET_ID \
                --REFERENTIEL_CAE_SHEET_ID=$REFERENTIEL_CAE_SHEET_ID \
                --REFERENTIEL_ECI_SHEET_ID=$REFERENTIEL_ECI_SHEET_ID \
                --INDICATEUR_DEFINITIONS_SHEET_ID=$INDICATEUR_DEFINITIONS_SHEET_ID \
                --GCLOUD_SERVICE_ACCOUNT_KEY=$GCLOUD_SERVICE_ACCOUNT_KEY \
                --SUPABASE_DATABASE_URL=$DB_URL \
                --SUPABASE_ANON_KEY=$ANON_KEY \
                --SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY \
                --SUPABASE_JWT_SECRET=$JWT_SECRET \
                --SUPABASE_URL=$API_URL \
                --TRAJECTOIRE_SNBC_XLSX_ID=$TRAJECTOIRE_SNBC_XLSX_ID \
                --BREVO_API_KEY=fake \
                --DIRECTUS_API_KEY=fake \
                --TRAJECTOIRE_SNBC_SHEET_ID=fake \
                --TRAJECTOIRE_SNBC_RESULT_FOLDER_ID=fake \
                --QUEUE_REDIS_HOST=localhost

            # Seed si aucune collectivité en base
            RUN docker run --rm \
                --network $network \
                psql:latest $DB_URL -v ON_ERROR_STOP=1 \
                -c "select 1 / count(*) from collectivite;" \
                || earthly +seed --DB_URL=$DB_URL

        END
    END

    IF [ "$app" = "yes" ]
        RUN earthly +app-run --API_URL=$API_URL --ANON_KEY=$ANON_KEY
    END

    IF [ "$auth" = "yes" ]
        RUN earthly +auth-run --API_URL=$API_URL --ANON_KEY=$ANON_KEY
    END

    RUN earthly +refresh-views --DB_URL=$DB_URL

BUILD_IF_NO_IMG:
    FUNCTION
    ARG --required IMG_NAME
    ARG --required IMG_TAG
    ARG --required BUILD_TARGET
    ARG pull=yes
    RUN echo "Searching for image $IMG_NAME:$IMG_TAG ..."
    IF [ "docker image ls | grep $IMG_NAME | grep $IMG_TAG" ]
        RUN echo "Image found, skipping"
    ELSE
        IF [ "$pull" = "yes" ]
            RUN echo "Image not found, trying to pull $REG_TARGET/$IMG_NAME:$IMG_TAG"
            IF [ "$CI" = "true" ]
                RUN docker pull $REG_TARGET/$IMG_NAME:$IMG_TAG || earthly --push +$BUILD_TARGET
            ELSE
                RUN docker pull $REG_TARGET/$IMG_NAME:$IMG_TAG || earthly +$BUILD_TARGET
            END
        ELSE
            RUN echo "Image not found, building +$BUILD_TARGET"
            IF [ "$CI" = "true" ]
                RUN earthly --push +$BUILD_TARGET
            ELSE
                RUN earthly +$BUILD_TARGET
            END
        END
    END

stop:
    LOCALLY
    IF [ "$CI" = "true" ]
        RUN supabase stop
    ELSE
        RUN pnpx supabase stop
    END
    RUN docker ps --filter name=_tet --filter status=running -aq | xargs docker stop | xargs docker rm || exit 0
    RUN earthly +clear-state

copy-volume: ## Copie un volume
     ARG --required from
     ARG --required to
     LOCALLY
     RUN docker volume rm $to || echo "volume $to not found"
     RUN docker volume create --name $to
     RUN docker run --rm \
        -v $from:/from \
        -v $to:/to \
        alpine ash -c "cd /from ; cp -av . /to"

save-db: ## Sauvegarde la db dans une image en vue de la publier
     ARG push=no
     LOCALLY
     RUN docker run \
        -v $DB_VOLUME_NAME:/volume \
        alpine ash -c "mkdir /save ; cd /volume ; cp -av . /save"
     RUN docker commit \
         $(docker ps -lq) \
         $DB_SAVE_IMG_NAME
     RUN docker container rm $(docker ps -lq)
     IF [ "$push" = "yes" ]
        RUN docker push $DB_SAVE_IMG_NAME
     END

restore-db: ## Restaure la db depuis une image
     ARG pull=no
     LOCALLY
     IF [ "$pull" = "yes" ]
        RUN docker pull $DB_SAVE_IMG_NAME || echo "Image $DB_SAVE_IMG_NAME not found in registry"
     END
     IF [ "docker image ls | grep db-save | grep $DL_TAG" ]
         RUN echo "Image $DB_SAVE_IMG_NAME found, restoring..."
         RUN docker volume rm $DB_VOLUME_NAME || echo "Volume $DB_VOLUME_NAME not found"
         RUN docker volume create --name $DB_VOLUME_NAME
         RUN docker run --rm \
            -v $DB_VOLUME_NAME:/volume \
            $DB_SAVE_IMG_NAME ash -c "cd /save ; cp -av . /volume"
     ELSE
         RUN echo "Image $DB_SAVE_IMG_NAME not found, cannot restore"
         RUN exit 1
     END

prepare-faster:
     ARG push=no
     ARG stop=yes
     ARG --required DB_URL
     ARG --required SERVICE_ROLE_KEY
     ARG --required API_URL
     ARG --required ANON_KEY
     ARG --required JWT_SECRET
     ARG --required REFERENTIEL_TE_SHEET_ID
     ARG --required REFERENTIEL_CAE_SHEET_ID
     ARG --required REFERENTIEL_ECI_SHEET_ID
     ARG --required INDICATEUR_DEFINITIONS_SHEET_ID
     ARG --required TRAJECTOIRE_SNBC_XLSX_ID
     ARG --required GCLOUD_SERVICE_ACCOUNT_KEY
     LOCALLY
     IF [ "$push" = "yes" ]
        RUN docker pull $DB_SAVE_IMG_NAME || echo "Image $DB_SAVE_IMG_NAME not found in registry"
     END
     IF [ "docker image ls | grep db-save | grep $DL_TAG" ]
         RUN echo "Image $DB_SAVE_IMG_NAME found, skipping..."
     ELSE
         RUN echo "Image $DB_SAVE_IMG_NAME not found, start datalayer"
         RUN earthly +dev \
            --stop=$stop --business=no --app=no --fast=no \
            --DB_URL=$DB_URL \
            --ANON_KEY=$ANON_KEY \
            --SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY \
            --JWT_SECRET=$JWT_SECRET \
            --API_URL=$API_URL \
            --REFERENTIEL_TE_SHEET_ID=$REFERENTIEL_TE_SHEET_ID \
            --REFERENTIEL_CAE_SHEET_ID=$REFERENTIEL_CAE_SHEET_ID \
            --REFERENTIEL_ECI_SHEET_ID=$REFERENTIEL_ECI_SHEET_ID \
            --INDICATEUR_DEFINITIONS_SHEET_ID=$INDICATEUR_DEFINITIONS_SHEET_ID \
            --TRAJECTOIRE_SNBC_XLSX_ID=$TRAJECTOIRE_SNBC_XLSX_ID \
            --GCLOUD_SERVICE_ACCOUNT_KEY=$GCLOUD_SERVICE_ACCOUNT_KEY
         RUN earthly +save-db --push=$push
     END

prepare-fast:
    ARG version  # version du plan
    LOCALLY
    # si la version du plan n'est pas spécifiée on utilise le tag courant
    ARG v=$(if [ -z $version ]; then sqitch status | grep @v | sed -E 's/.*@(v[0-9.]*)/\1/'; else echo $version; fi)
    RUN earthly +dev --stop=yes --business=no --app=no --fast=no --version=$v
    RUN earthly +save-state

clear-state:
    ARG saved=no
    LOCALLY
    RUN docker volume rm supabase_db_tet || echo "could not clear current state: not found"
    RUN docker volume rm supabase_storage_tet || echo "could not clear current state: not found"

    IF [ "$saved" = "yes" ]
        RUN docker volume rm supabase_db_tet_save || echo "could not clear saved state: not found"
        RUN docker volume rm supabase_storage_tet_save || echo "could not clear saved state: not found"
    END

save-state:
    LOCALLY
    RUN earthly +copy-volume --from supabase_db_tet --to supabase_db_tet_save
    RUN earthly +copy-volume --from supabase_storage_tet --to supabase_storage_tet_save

restore-state:
    LOCALLY
    RUN earthly +copy-volume --from supabase_db_tet_save --to supabase_db_tet || echo "could not restore state"
    RUN earthly +copy-volume --from supabase_storage_tet_save --to supabase_storage_tet || echo "could not restore state"

test:
    LOCALLY
    RUN earthly +curl-test
    RUN earthly +db-test
    RUN earthly +api-test
    RUN earthly +db-deploy-test
    RUN earthly +app-test

docker-dev-login: ## permet de s'identifier sur la registry
    ARG --required GH_USER
    ARG --required GH_TOKEN
    LOCALLY
    RUN docker login $REGISTRY -u $GH_USER -p $GH_TOKEN

koyeb-bin: ## extrait le binaire koyeb de l'image officielle
    FROM koyeb/koyeb-cli:latest
    SAVE ARTIFACT ./koyeb

koyeb:
    ARG --required KOYEB_API_KEY
    FROM alpine
    COPY +koyeb-bin/koyeb ./
    RUN echo "token: $KOYEB_API_KEY" > ~/.koyeb.yaml

auth-deploy:
    ARG --required KOYEB_API_KEY
    FROM +koyeb
    RUN ./koyeb services update $ENV_NAME-auth/front --docker $AUTH_IMG_NAME

app-deploy-test: ## Déploie une app de test et crée une app Koyeb si nécessaire
    ARG --required KOYEB_API_KEY
    LOCALLY
    # Limite des noms dans Koyeb : 23 caractères.
    # Comme on prefixe avec `test-app-`, on garde 14 caractères max dans le nom de la branche.
    # En octobre 2024, Koyeb applique cette règle sur les noms des apps déployées :
    # ^[a-z0-9]+([.-][a-z0-9]+)*$ and from 3 to 23 chars
    # (info récupérée auprès du service support)
    ARG name=$(git rev-parse --abbrev-ref HEAD | sed 's/[^a-zA-Z0-9]//g' | head -c 14 | tr '[:upper:]' '[:lower:]')
    FROM +koyeb --KOYEB_API_KEY=$KOYEB_API_KEY
    IF [ "./koyeb apps list | grep test-app-$name" ]
        RUN echo "Test app already deployed on Koyeb at test-app-$name, updating..."
        RUN /koyeb services update test-app-$name/test-app-$name --docker $APP_TEST_IMG_NAME
    ELSE
        RUN echo "Test app not found on Koyeb at test-app-$name, creating with $APP_TEST_IMG_NAME..."
        RUN /koyeb apps init "test-app-$name" \
          --docker "$APP_TEST_IMG_NAME" --docker-private-registry-secret ghcr \
          --type web --port 3000:http --route /:3000 --env PORT=3000 \
          --regions par
    END

app-destroy-test: ## Supprime l'app de test
    ARG --required KOYEB_API_KEY
    ARG --required BRANCH_NAME
    LOCALLY
    ARG name=$(echo $BRANCH_NAME | sed 's/[^a-zA-Z0-9]//g' | head -c 14 | tr '[:upper:]' '[:lower:]')
    FROM +koyeb
    RUN ./koyeb apps list  # Le IF suivant ne fonctionne pas sans lister avant.
    IF [ "./koyeb apps list | grep test-app-$name" ]
        RUN echo "Test app already deployed on Koyeb at test-app-$name, deleting..."
        RUN /koyeb apps delete test-app-$name
    ELSE
        RUN echo "Test app not found on Koyeb at test-app-$name, nothing to delete..."
    END

help: ## affiche ce message d'aide
    LOCALLY
    RUN grep -h "##" ./Earthfile | grep -v grep | sed -e 's/##//'
