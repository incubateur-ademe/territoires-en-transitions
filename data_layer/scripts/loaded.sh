#!/bin/bash

DATALAYER_DIR="./../postgres"

# This script exits with an error if the content is not loaded.
psql -c "select 1" || exit 1
psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/base.sql || exit 1
psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/rpc.sql || exit 1
psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/content.sql || exit 1
psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/fakes.sql || exit 1
exit 0
