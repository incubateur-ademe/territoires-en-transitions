#!/bin/sh

set -e

if [ -z "$TO_DB_URL" ]; then
    if [ -z "$CI" ]; then
        TO_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
    else
        echo "Missing TO_DB_URL environment variable"
        exit 1
    fi
fi

if [[ $TO_DB_URL == *"rlarzronkgoyvtdkltqy"* ]]; then
    echo "Can't sync to production database"
    exit 1
fi

if [ -z "$FROM_DB_URL" ]; then
    echo "Missing FROM_DB_URL environment variable"
    exit 1
fi

echo "Syncing FROM_DB_URL=$FROM_DB_URL TO_DB_URL=$TO_DB_URL"

echo "Waiting fo 30 seconds before starting the sync, please double check urls"
sleep 30

# Collectivites
printf "\n\n----------------------------\n---- Syncing collectivites_group ----"
pgsync collectivites_group --jobs 1 --debug --disable-user-triggers  --from "$FROM_DB_URL" --to "$TO_DB_URL" --to-safe

# Referentiels
printf "\n\n----------------------------\n---- Syncing referentiels_group ----"
pgsync referentiels_group --jobs 1 --debug --disable-user-triggers  --from "$FROM_DB_URL" --to "$TO_DB_URL" --to-safe

# Indicateurs
printf "\n\n----------------------------\n---- Syncing indicateurs_group ----"
pgsync indicateurs_group --jobs 1 --debug --disable-user-triggers  --from "$FROM_DB_URL" --to "$TO_DB_URL" --to-safe

# PAI
printf "\n\n----------------------------\n---- Syncing pai_group ----"
pgsync pai_group --jobs 1 --debug --disable-user-triggers  --from "$FROM_DB_URL" --to "$TO_DB_URL" --to-safe

# Plans
printf "\n\n----------------------------\n---- Syncing plans_group ----"
pgsync plans_group --jobs 1 --debug --disable-user-triggers  --from "$FROM_DB_URL" --to "$TO_DB_URL" --to-safe
