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
    ARG SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
    COPY ./data_layer/content /content
    RUN --push sh ./content/load.sh

update-scores:
    FROM +postgres
    ARG --required DB_URL
    ARG count=20
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    RUN --push psql $PG_URL -v ON_ERROR_STOP=1 -c "select evaluation.update_late_collectivite_scores($count);" || exit 1

business-build:
    FROM python:3.9
    ARG --required SUPABASE_SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG APP_DIR="./business"
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ENV SUPABASE_URL=$URL
    ENV SUPABASE_KEY=$SUPABASE_SERVICE_ROLE_KEY
    WORKDIR /business
    COPY $APP_DIR/requirements.txt .
    RUN pip install -r requirements.txt
    COPY $APP_DIR .
    RUN pip install -e .
    EXPOSE 8888
    CMD ["uvicorn", "evaluation_api:app", "--host", "0.0.0.0", "--port", "8888"]
    SAVE IMAGE business:latest

business-start:
    FROM +business-build
    LOCALLY
    RUN docker run -p 8888:8888 -d --rm --name business_territoiresentransitions business:latest

business-test:
    FROM +business-build
    COPY ./markdown /markdown
    RUN pytest tests

react:
    FROM node:16
    ARG APP_DIR="./app.territoiresentransitions.react"
    ENV LANG fr_FR.UTF-8
    RUN apt-get update && apt-get install -y locales && rm -rf /var/lib/apt/lists/* && locale-gen "fr_FR.UTF-8"
    WORKDIR "/app"
    COPY $APP_DIR/package.json ./
    COPY $APP_DIR/package-lock.json ./
    RUN npm i
    COPY $APP_DIR .
    EXPOSE 3000
    CMD npm start

client-build:
    FROM +react
    ARG --required SUPABASE_ANON_KEY
    ARG --required API_URL
    ARG REACT_APP_SUPABASE_URL=$API_URL
    ARG REACT_APP_SUPABASE_KEY=$SUPABASE_ANON_KEY
    ARG ZIP_ORIGIN_OVERRIDE="http://kong:8000"
    RUN npm run build
    SAVE IMAGE client:latest

client-start:
    FROM +client-build
    LOCALLY
    RUN docker run -p 3000:3000 -d --rm --name client_territoiresentransitions client:latest

client-test-build:
    FROM +react
    ARG --required SUPABASE_ANON_KEY
    ARG --required API_URL
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ARG ZIP_ORIGIN_OVERRIDE="http://kong:8000"
    ENV REACT_APP_SUPABASE_KEY=$SUPABASE_ANON_KEY
    ENV REACT_APP_SUPABASE_URL=$URL
    ENV CI=true
    CMD npm run test
    SAVE IMAGE client-test:latest

client-test:
    FROM +client-test-build
    LOCALLY
    RUN docker run --rm --name client_test_territoiresentransitions client-test:latest

setup-env:
    LOCALLY
    RUN earthly +stop
    RUN supabase start
    RUN supabase status -o env --override-name auth.anon_key=SUPABASE_ANON_KEY --override-name auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY > .env
    RUN export $(cat .env | xargs) && sh ./make_dot_env.sh
    RUN earthly +stop

dev:
    LOCALLY
    ARG stop=yes
    ARG datalayer=yes
    ARG business=yes
    ARG client=no

    IF [ "$stop" = "yes" ]
        RUN earthly --push +stop
    END

    IF [ "$datalayer" = "yes" ]
        RUN supabase start
        RUN earthly --push +deploy
        RUN earthly --push +seed
        RUN earthly --push +load-contents
    END

    IF [ "$business" = "yes" ]
        RUN earthly +business-start
        RUN earthly --push +update-scores
    END

    IF [ "$client" = "yes" ]
        RUN earthly +client-start
    END

stop:
    LOCALLY
    RUN docker ps --filter name=transitions --filter status=running -aq | xargs docker stop | xargs docker rm

stats:
    LOCALLY
    RUN docker stats $(docker ps --format '{{.Names}}' --filter name=transitions) || exit 0

test:
    FROM +dev
    LOCALLY
    RUN earthly +business-test
    RUN earthly +client-test

