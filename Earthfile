VERSION 0.7

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

pg-tap:
    FROM +postgres
    RUN apt-get update
    RUN apt-get install cpanminus -y
    RUN cpanm TAP::Parser::SourceHandler::pgTAP

db-test:
    ARG --required DB_URL
    FROM +pg-tap
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    ARG PGHOST=$(echo $PG_URL | cut -d@ -f2 | cut -d: -f1)
    ARG PGPORT=$(echo $PG_URL | cut -d: -f4 | cut -d/ -f1)
    ARG PGUSER=$(echo $PG_URL | cut -d: -f3 | cut -d@ -f1)
    ARG PGPASSWORD=$(echo $PG_URL | cut -d: -f3 | cut -d@ -f1)
    ARG PGDATABASE=$(echo $PG_URL | cut -d/ -f4)
    ENV PGHOST=$PGHOST
    ENV PGPORT=$PGPORT
    ENV PGUSER=$PGUSER
    ENV PGPASSWORD=$PGPASSWORD
    ENV PGDATABASE=$PGDATABASE
    COPY ./data_layer/tests /tests
    RUN --push pg_prove tests/**/*.sql

deploy:
    ARG --required DB_URL
    ARG MODE=change
    FROM +sqitch
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    RUN --push sqitch deploy db:$PG_URL --mode $MODE

deploy-test:
    ARG --required DB_URL
    ARG tag="v2.14"
    FROM +sqitch
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    RUN --push sqitch deploy db:$PG_URL --mode change
    RUN --push sqitch revert db:$PG_URL --to @$tag --y
    RUN --push sqitch deploy db:$PG_URL --mode change --verify

seed:
    ARG --required DB_URL
    ARG SKIP_TEST_DOMAIN=0
    FROM +postgres
    ARG PG_URL=$(echo $DB_URL | sed "s/localhost/host.docker.internal/")
    COPY ./data_layer/seed /seed
    RUN --push sh ./seed/seed.sh

load-contents:
    FROM alpine/curl
    ARG --required SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
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
    ARG --required SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG APP_DIR="./business"
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ENV SUPABASE_URL=$URL
    ENV SUPABASE_KEY=$SERVICE_ROLE_KEY
    WORKDIR /business
    COPY $APP_DIR/requirements.txt .
    RUN pip install -r requirements.txt
    COPY $APP_DIR .
    RUN pip install -e .
    EXPOSE 8888
    CMD ["uvicorn", "evaluation_api:app", "--host", "0.0.0.0", "--port", "8888"]
    SAVE IMAGE business:latest

business-start:
    BUILD +business-build
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
    ARG --required ANON_KEY
    ARG --required API_URL
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ENV REACT_APP_SUPABASE_URL=$API_URL
    ENV REACT_APP_SUPABASE_KEY=$ANON_KEY
    ENV ZIP_ORIGIN_OVERRIDE=$URL
    RUN npm run build
    SAVE IMAGE client:latest

client-start:
    BUILD +client-build
    LOCALLY
    RUN docker run -p 3000:3000 -d --rm --name client_territoiresentransitions client:latest

client-test:
    FROM +react
    ARG --required ANON_KEY
    ARG --required API_URL
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ARG ZIP_ORIGIN_OVERRIDE=$URL
    ENV REACT_APP_SUPABASE_KEY=$ANON_KEY
    ENV REACT_APP_SUPABASE_URL=$URL
    ENV CI=true
    RUN --push npm run test

api-test:
    FROM denoland/deno
    ARG --required ANON_KEY
    ARG --required API_URL
    WORKDIR tests
    COPY ./api_tests .
    ARG URL=$(echo $API_URL | sed "s/localhost/host.docker.internal/")
    ENV SUPABASE_URL=$URL
    ENV SUPABASE_KEY=$ANON_KEY
    RUN deno cache tests/smoke.test.ts
    RUN deno test --allow-net --allow-env --allow-read tests/smoke.test.ts --location 'http://localhost'
    RUN deno test --allow-net --allow-env --allow-read tests/test/utilisateur.test.ts --location 'http://localhost'

cypress-wip:
    FROM cypress/included:12.3.0
    ENV ELECTRON_EXTRA_LAUNCH_ARGS="--disable-gpu"
    WORKDIR /e2e
    COPY ./e2e/package.json /e2e/package.json
    RUN npm install
    COPY ./e2e/ /e2e
    RUN npm test

setup-env:
    LOCALLY
    RUN earthly +stop
    RUN supabase start
    RUN supabase status -o env > .arg
    RUN export $(cat .arg | xargs) && sh ./make_dot_env.sh
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
    RUN supabase stop
    RUN docker ps --filter name=transitions --filter status=running -aq | xargs docker stop | xargs docker rm | exit 0

stats:
    LOCALLY
    RUN docker stats $(docker ps --format '{{.Names}}' --filter name=transitions) || exit 1

test:
    FROM +dev
    LOCALLY
    RUN earthly --push +db-test
    RUN earthly --push +business-test
    RUN earthly --push +client-test
    RUN earthly --push +api-test
    RUN earthly --push +deploy-test

