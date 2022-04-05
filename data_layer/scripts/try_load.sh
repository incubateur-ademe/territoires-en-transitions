#!/bin/bash
# This script waits for the db to be ready then load the content


DATALAYER_DIR="./../postgres"

until psql -c "select 1"; do
  echo "Waiting for supabase-db..."
  sleep 1
done

until psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/supabase.sql; do
  echo "Waiting for supabase auth and storage migration..."
  sleep 1
done


echo "Loading definitions..."
for file in "$DATALAYER_DIR"/definitions/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Loading content..."
for file in "$DATALAYER_DIR"/content/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Loading fakes..."
for file in "$DATALAYER_DIR"/fakes/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Done loading."
sleep infinity
