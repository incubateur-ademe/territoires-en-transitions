#!/bin/sh

DATALAYER_DIR="./seed"

echo "Loading geojson..."
for file in "$DATALAYER_DIR"/geojson/*.sql; do
    psql "$PG_URL" -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done
