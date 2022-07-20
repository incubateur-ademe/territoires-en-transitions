#!/bin/bash
# This script waits for the db to be ready then load the content


DATALAYER_DIR="./../postgres"

until psql -c "select 1"; do
  echo "Waiting for supabase-db..."
  sleep 10
done

until psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/supabase_auth.sql; do
  echo "Waiting for supabase auth migration..."
  sleep 10
done

until psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/supabase_storage.sql; do
  echo "Waiting for supabase storage migration..."
  sleep 10
done

until psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/sqitch.sql; do
  echo "Waiting for sqitch migration..."
  sleep 10
done

echo "Loading content..."
for file in "$DATALAYER_DIR"/content/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Loading imports..."
for file in "$DATALAYER_DIR"/imports/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Loading fakes..."
for file in "$DATALAYER_DIR"/fakes/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Load test domain.."
for file in "$DATALAYER_DIR"/test/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Done loading."
sleep infinity
