#!/bin/sh

DATALAYER_DIR="./seed"

echo "Loading content..."
for file in "$DATALAYER_DIR"/content/*.sql; do
    psql "$PG_URL" -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Loading imports..."
for file in "$DATALAYER_DIR"/imports/*.sql; do
    psql "$PG_URL" -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Loading fakes..."
for file in "$DATALAYER_DIR"/fakes/*.sql; do
    psql "$PG_URL" -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

if [ "$SKIP_TEST_DOMAIN" = 1 ];
then
echo "Skipping test domain."
else
echo "Load test domain.."
for file in "$DATALAYER_DIR"/test/*.sql; do
    psql "$PG_URL" -v ON_ERROR_STOP=1 --file "${file}" || exit 1
done

echo "Enabling evaluation API..."
psql "$PG_URL" -v ON_ERROR_STOP=1 -c 'select test.enable_evaluation_api();' || exit 1
fi

echo "Done!"
exit 0
