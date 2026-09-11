VERSION 0.8

# Ce qu'il reste d'Earthly : les cibles data layer sans équivalent dans le
# Makefile. Tout ce qui touchait à la stack locale (services, migrations,
# seeds, tests unitaires) est passé au Makefile + docker-compose, et les
# builds d'images applicatives aux Dockerfile des apps.

LOCALLY
ARG --global API_DIR='./packages/api'
# paramètres de la base de registre des images docker générées
ARG --global REGISTRY='ghcr.io'
ARG --global REG_USER='territoiresentransitions'
ARG --global REG_TARGET=$REGISTRY/$REG_USER
# tags appliqués aux images docker générées
ARG --global ENV_NAME="dev"
ARG --global DL_TAG=$ENV_NAME-$(sh ./subdirs_hash.sh data_layer)


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

db-test: ## lance les tests pgTAP de data_layer/tests
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

db-deploy-test: ## joue un aller-retour deploy/revert/verify des migrations
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

refresh-views: ## rafraîchit les vues matérialisées
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +psql-build
    RUN docker run --rm \
        --network $network \
        psql:latest $DB_URL -v ON_ERROR_STOP=1 \
        -c "refresh materialized view stats.collectivite; refresh materialized view site_labellisation;"

gen-types: ## génère le typage à partir de la base de données
    LOCALLY
    IF [ "$CI" = "true" ]
        RUN supabase gen types typescript --local --schema public --schema labellisation > $API_DIR/src/database.types.ts
    ELSE
        RUN pnpx supabase gen types typescript --local --schema public --schema labellisation > $API_DIR/src/database.types.ts
    END
    RUN cp $API_DIR/src/database.types.ts ./supabase/functions/_shared/database.types.ts

docker-dev-login: ## permet de s'identifier sur la registry
    ARG --required GH_USER
    ARG --required GH_TOKEN
    LOCALLY
    RUN docker login $REGISTRY -u $GH_USER -p $GH_TOKEN

help: ## affiche ce message d'aide
    LOCALLY
    RUN grep -h "##" ./Earthfile | grep -v grep | sed -e 's/##//'
