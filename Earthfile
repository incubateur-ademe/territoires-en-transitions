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
    ARG DB_URL
    ARG SKIP_TEST_DOMAIN=0
    FROM +postgres
    COPY ./data_layer/seed /seed
    RUN --push sh ./seed/seed.sh

business-docker:
    FROM DOCKERFILE ./business/
    SAVE IMAGE business:latest

save-env:
    LOCALLY
    RUN supabase status -o env --override-name auth.anon_key=SUPABASE_ANON_KEY --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY > .env
    RUN export $(cat .env | xargs) && sh ./make_dot_env.sh

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

stop:
    LOCALLY
    RUN docker ps --filter name=_territoiresentransitions.fr --filter status=running -aq | xargs docker stop | xargs docker rm

stats:
    LOCALLY
    RUN docker stats $(docker ps --format '{{.Names}}' --filter name=_territoiresentransitions.fr)
