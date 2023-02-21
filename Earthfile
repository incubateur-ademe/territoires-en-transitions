VERSION 0.6

postgres:
    FROM postgres:15

sqitch:
    FROM +postgres
    RUN apt-get update
    RUN apt-get install -y curl build-essential cpanminus perl perl-doc libdbd-pg-perl postgresql-client
    RUN cpanm --quiet --notest App::Sqitch
    ENTRYPOINT ["sqitch"]
    CMD ["help"]
    COPY sqitch.conf ./sqitch.conf
    COPY ./data_layer/sqitch ./data_layer/sqitch

deploy:
    ARG --required DB_URL
    ARG MODE=change
    FROM +sqitch
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    RUN --push sqitch deploy db:$PG_URL --mode $MODE

seed:
    ARG --required DB_URL
    ARG SKIP_TEST_DOMAIN=0
    FROM +postgres
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    COPY ./data_layer/seed /seed
    RUN --push sh ./seed/seed.sh

load-contents:
    FROM alpine/curl
    ARG --required SUPABASE_SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ARG SERVICE_ROLE_KEY=$(echo $SUPABASE_SERVICE_ROLE_KEY)
    COPY ./data_layer/content /content
    RUN --push sh ./content/load.sh

update-scores:
    FROM +postgres
    ARG --required DB_URL
    ARG count=20
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    RUN --push psql $PG_URL -v ON_ERROR_STOP=1 -c "select evaluation.update_late_collectivite_scores($count);" || exit 1

business-build:
    FROM DOCKERFILE ./business/
    SAVE IMAGE business:latest

business-start:
    LOCALLY
    RUN earthly +business-build
    RUN docker rm business_territoiresentransitions.fr || exit 0
    RUN docker run -p 8888:8888 -d --name business_territoiresentransitions.fr business:latest

setup-env:
    LOCALLY
    RUN earthly +stop
    RUN supabase start
    RUN supabase status -o env --override-name auth.anon_key=SUPABASE_ANON_KEY --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY > .env
    RUN export $(cat .env | xargs) && sh ./make_dot_env.sh
    RUN earthly +stop

dev:
    LOCALLY
    RUN earthly --push +stop

    RUN supabase start
    RUN earthly --push +deploy
    RUN earthly --push +seed
    RUN earthly --push +load-contents

    RUN earthly +business-start
    RUN earthly --push +update-scores

stop:
    LOCALLY
    RUN docker ps --filter name=transitions --filter status=running -aq | xargs docker stop | xargs docker rm

stats:
    LOCALLY
    RUN docker stats $(docker ps --format '{{.Names}}' --filter name=transitions)
