#!/bin/sh
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

echo "Running Sqitch.."
sqitch deploy --chdir /sqitch || exit 1

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

if [ "$SKIP_TEST_DOMAIN" = 1 ];
then
echo "Skipping test domain."
else
echo "Load test domain.."
for file in "$DATALAYER_DIR"/test/*.sql; do
    psql -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Refreshing stats materialized views..."
psql -v ON_ERROR_STOP=1 -c 'select stats.refresh_views();' || exit 1
psql -v ON_ERROR_STOP=1 -c 'select stats.refresh_views_utilisation();' || exit 1
psql -v ON_ERROR_STOP=1 -c 'select stats.refresh_stats_locales();' || exit 1

echo "Done!"
exit 0
