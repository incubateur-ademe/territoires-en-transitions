#!/bin/sh

DATALAYER_DIR="./../postgres"

psql -c "select 1" || exit 1
psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/sqitch.sql || exit 1
exit 0
