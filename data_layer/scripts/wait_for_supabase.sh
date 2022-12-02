#!/bin/sh
# This script waits for the db to be ready

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

echo "Supabase is loaded!"
exit 0
