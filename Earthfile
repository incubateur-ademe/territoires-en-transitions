VERSION 0.7

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
    COPY sqitch.conf ./sqitch.conf
    COPY ./data_layer/sqitch ./data_layer/sqitch
    SAVE IMAGE sqitch:latest

pg-tap-build:
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
    RUN earthly +pg-tap-build
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
    RUN earthly +sqitch-build
    RUN docker run --rm \
        --network $network \
        --env SQITCH_TARGET=db:$DB_URL \
        sqitch:latest deploy --mode change

deploy-test:
    ARG --required DB_URL
    ARG network=host
    ARG tag=v2.26.0
    LOCALLY
    RUN earthly +sqitch-build
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
    COPY ./data_layer/scripts/load_json_content.sh /content/load.sh
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
    ARG url=http://supabase_kong_tet:8000
    ARG network=supabase_network_tet
    LOCALLY
    RUN earthly +business-build
    RUN docker run -d --rm \
        --name business_tet \
        --network $network \
        --publish 8888:8888 \
        --env SUPABASE_URL=$url \
        --env SUPABASE_KEY=$SERVICE_ROLE_KEY \
        business:latest

business-test-build:
    FROM +business-build
    COPY ./markdown /markdown
    CMD pytest tests
    SAVE IMAGE business-test:latest

business-test:
    ARG --required SERVICE_ROLE_KEY
    ARG url=http://supabase_kong_tet:8000
    ARG network=supabase_network_tet
    LOCALLY
    RUN earthly +business-test-build
    RUN docker run --rm \
        --name business-test_tet \
        --network $network \
        --env SUPABASE_URL=$url \
        --env SUPABASE_KEY=$SERVICE_ROLE_KEY \
        business-test:latest

business-parse:
    FROM +business-build
    COPY ./markdown /markdown
    RUN mkdir /content
    RUN sh ./referentiel_parse_all.sh
    SAVE ARTIFACT /content AS LOCAL ./data_layer/content
    SAVE ARTIFACT /content AS LOCAL ./business/tests/data/dl_content

client-deps:
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
    FROM +client-deps
    ARG --required ANON_KEY
    ARG --required BROWSER_API_URL
    ARG --required SERVER_API_URL
    ENV REACT_APP_SUPABASE_URL=$BROWSER_API_URL
    ENV REACT_APP_SUPABASE_KEY=$ANON_KEY
    ENV ZIP_ORIGIN_OVERRIDE=$SERVER_API_URL
    RUN npm run build
    SAVE IMAGE client:latest

client:
    ARG --required ANON_KEY
    ARG --required API_URL
    ARG internal_url=http://supabase_kong_tet:8000
    ARG network=supabase_network_tet
    LOCALLY
    RUN earthly +client-build --ANON_KEY=$ANON_KEY --BROWSER_API_URL=$API_URL --SERVER_API_URL=$internal_url
    RUN docker run -d --rm \
        --name client_tet \
        --network $network \
        --publish 3000:3000 \
        client:latest

client-test-build:
    FROM +client-deps
    ENV REACT_APP_SUPABASE_URL
    ENV REACT_APP_SUPABASE_KEY
    ENV ZIP_ORIGIN_OVERRIDE
    ENV CI=true
    CMD npm run test
    SAVE IMAGE client-test:latest

client-test:
    ARG --required ANON_KEY
    ARG url=http://supabase_kong_tet:8000
    ARG network=supabase_network_tet
    LOCALLY
    RUN earthly +client-test-build
    RUN docker run --rm \
        --name client-test_tet \
        --network $network \
        --env REACT_APP_SUPABASE_URL=$url \
        --env REACT_APP_SUPABASE_KEY=$ANON_KEY \
        --env ZIP_ORIGIN_OVERRIDE=$url \
        client-test:latest

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

api-test-build:
    FROM denoland/deno
    ENV SUPABASE_URL
    ENV SUPABASE_KEY
    WORKDIR tests
    COPY ./api_tests .
    RUN deno cache tests/smoke.test.ts
    CMD deno test --allow-net --allow-env --allow-read tests/smoke.test.ts --location 'http://localhost' && \
        deno test --allow-net --allow-env --allow-read tests/test/utilisateur.test.ts --location 'http://localhost' && \
        deno test --allow-net --allow-env --allow-read tests/labellisation/audit.test.ts --location 'http://localhost'
    SAVE IMAGE api-test:latest

api-test:
    ARG --required SERVICE_ROLE_KEY
    ARG --required API_URL
    ARG network=host
    LOCALLY
    RUN earthly +api-test-build
    RUN docker run --rm \
        --name api_test_tet \
        --network $network \
        --env SUPABASE_KEY=$SERVICE_ROLE_KEY \
        --env SUPABASE_URL=$API_URL \
        api-test:latest

cypress-wip:
    FROM cypress/included:12.3.0
    ENV ELECTRON_EXTRA_LAUNCH_ARGS="--disable-gpu"
    WORKDIR /e2e
    COPY ./e2e/package.json /e2e/package.json
    RUN npm install
    COPY ./e2e/ /e2e
    RUN npm test

gen-types:
    LOCALLY
    IF [ "$CI" = "true" ]
        RUN supabase gen types typescript --local --schema public --schema labellisation > ./app.territoiresentransitions.react/src/types/database.types.ts
    ELSE
        RUN npx supabase gen types typescript --local --schema public --schema labellisation > ./app.territoiresentransitions.react/src/types/database.types.ts
    END
    RUN cp ./app.territoiresentransitions.react/src/types/database.types.ts ./api_tests/lib/database.types.ts
    RUN cp ./app.territoiresentransitions.react/src/types/database.types.ts ./site/app/database.types.ts

setup-env:
    LOCALLY
    RUN earthly +stop
    IF [ "$CI" = "true" ]
        RUN supabase start
        RUN supabase status -o env > .arg
    ELSE
        RUN npm install
        RUN npx supabase start
        RUN npx supabase status -o env > .arg
    END
    RUN export $(cat .arg | xargs) && sh ./make_dot_env.sh
    RUN earthly +stop

dev:
    LOCALLY
    ARG stop=yes
    ARG datalayer=yes
    ARG business=yes
    ARG client=no
    ARG eco=no

    IF [ "$stop" = "yes" ]
        RUN earthly +stop --npx=$npx
    END

    IF [ "$datalayer" = "yes" ]
        IF [ "$CI" = "true" ]
            RUN supabase start
            RUN docker stop supabase_studio_tet
            RUN docker stop supabase_pg_meta_tet
        ELSE
            RUN npx supabase start
        END

        IF [ "$eco" = "yes" ]
            RUN docker stop storage_imgproxy_tet
            RUN docker stop supabase_studio_tet
            RUN docker stop supabase_pg_meta_tet
        END

        RUN earthly +deploy
        RUN earthly +seed
        RUN earthly +load-json
    END

    IF [ "$business" = "yes" ]
        RUN earthly +business
        RUN earthly +update-scores
    END

    IF [ "$client" = "yes" ]
        RUN earthly +client
    END

stop:
    LOCALLY
    IF [ "$CI" = "true" ]
        RUN supabase stop
    ELSE
        RUN npx supabase stop
    END
    RUN docker ps --filter name=_tet --filter status=running -aq | xargs docker stop | xargs docker rm || exit 0

test:
    LOCALLY
    RUN earthly +curl-test
    RUN earthly +db-test
    RUN earthly +business-test
    RUN earthly +api-test
    RUN earthly +deploy-test
    RUN earthly +client-test

