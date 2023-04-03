VERSION 0.7

postgres:
    FROM postgres:15

psql-build:
    FROM +postgres
    ENTRYPOINT ["psql"]
    SAVE IMAGE psql:latest

sqitch:
    FROM +postgres
    RUN apt-get update
    RUN apt-get install -y curl build-essential cpanminus perl perl-doc libdbd-pg-perl postgresql-client
    RUN cpanm --quiet --notest App::Sqitch
    ENTRYPOINT ["sqitch"]
    CMD ["help"]
    COPY sqitch.conf ./sqitch.conf
    COPY ./data_layer/sqitch ./data_layer/sqitch
    SAVE IMAGE sqitch:latest

pg-tap:
    FROM +postgres
    RUN apt-get update
    RUN apt-get install cpanminus -y
    RUN cpanm TAP::Parser::SourceHandler::pgTAP
    ENTRYPOINT ["pg_prove"]
    CMD ["./tests/collectivite/identite.sql"]
    COPY ./data_layer/tests ./tests
    SAVE IMAGE pg-tap:latest

db-test:
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +pg-tap
    RUN docker run --rm \
        --network $network \
        --env PGHOST=$(echo $DB_URL | cut -d@ -f2 | cut -d: -f1) \
        --env PGPORT=$(echo $DB_URL | cut -d: -f4 | cut -d/ -f1) \
        --env PGUSER=$(echo $DB_URL | cut -d: -f3 | cut -d@ -f1) \
        --env PGPASSWORD=$(echo $DB_URL | cut -d: -f3 | cut -d@ -f1) \
        --env PGDATABASE=$(echo $DB_URL | cut -d/ -f4) \
        pg-tap:latest

deploy:
    ARG --required DB_URL
    ARG network=host
    LOCALLY
    RUN earthly +sqitch
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        sqitch:latest deploy --mode change

deploy-test:
    ARG --required DB_URL
    ARG network=host
    ARG tag=v2.14
    LOCALLY
    RUN earthly +sqitch
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        sqitch:latest deploy --mode change
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        sqitch:latest revert --to @$tag --y
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        sqitch:latest deploy --mode change --verify

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
        seed:latest deploy --mode change

load-json-build:
    FROM curlimages/curl
    ENV SERVICE_ROLE_KEY
    ENV API_URL
    COPY ./data_layer/content /content
    ENTRYPOINT sh ./content/load.sh
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
        load-json:latest deploy --mode change

update-scores:
    ARG --required DB_URL
    ARG count=20
    ARG network=host
    LOCALLY
    RUN earthly +psql-build
    RUN docker run --rm \
        --network $network \
        psql:latest $DB_URL -v ON_ERROR_STOP=1 \
        -c "select evaluation.update_late_collectivite_scores($count);"

business-build:
    FROM python:3.9
    ENV SUPABASE_URL
    ENV SUPABASE_KEY
    WORKDIR /business
    COPY ./business/requirements.txt .
    RUN pip install -r requirements.txt
    COPY ./business .
    RUN pip install -e .
    EXPOSE 8888
    CMD ["uvicorn", "evaluation_api:app", "--host", "0.0.0.0", "--port", "8888"]
    SAVE IMAGE business:latest

business:
    ARG --required SERVICE_ROLE_KEY
    ARG network=supabase_network_tet
    LOCALLY
    RUN earthly +business-build
    RUN docker run -d --rm \
        --name business_tet \
        --network $network \
        --publish 8888:8888 \
        --env SUPABASE_URL="http://supabase_kong_tet:8000" \
        --env SUPABASE_KEY=$SERVICE_ROLE_KEY \
        business:latest

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
    RUN docker run -p 3000:3000 -d --rm --name client_tet client:latest

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

curl-test-build:
    FROM curlimages/curl
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
        RUN earthly +deploy
        RUN earthly +seed
        RUN earthly +load-json
    END

    IF [ "$business" = "yes" ]
        RUN earthly +business-build
        RUN earthly +business
        RUN earthly +update-scores
    END

    IF [ "$client" = "yes" ]
        RUN earthly +client-build
        RUN earthly +client-start
    END

stop:
    LOCALLY
    RUN supabase stop
    RUN docker ps --filter name=_tet --filter status=running -aq | xargs docker stop | xargs docker rm || exit 0

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

