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
    ARG DB_URL
    ARG MODE=change
    FROM +sqitch
    RUN --push sqitch deploy db:$DB_URL --mode $MODE

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

business-docker:
    FROM DOCKERFILE ./business/
    SAVE IMAGE business:latest

setup-env:
    LOCALLY
    RUN earthly +stop
    RUN supabase start
    RUN supabase status -o env --override-name auth.anon_key=SUPABASE_ANON_KEY --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY > .env
    RUN export $(cat .env | xargs) && sh ./make_dot_env.sh
    RUN earthly +stop

dev:
    LOCALLY
    ARG DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
    RUN earthly +stop
    RUN supabase start

    FROM +business-docker
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")

    LOCALLY
    RUN docker run -p 8888:8888 -d --name business_territoiresentransitions.fr business:latest
    RUN earthly --push +deploy --DB_URL=$PG_URL
    RUN earthly --push +seed --DB_URL=$PG_URL
    RUN earthly --push +load-contents

stop:
    LOCALLY
    RUN docker ps --filter name=transitions --filter status=running -aq | xargs docker stop | xargs docker rm

stats:
    LOCALLY
    RUN docker stats $(docker ps --format '{{.Names}}' --filter name=transitions)
