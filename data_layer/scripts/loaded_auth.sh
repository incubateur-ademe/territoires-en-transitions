#!/bin/bash

DATALAYER_DIR="./../postgres"

# This script exits with an error if the content is not loaded.
psql -c "select 1" || exit 1
psql -v ON_ERROR_STOP=1 --file "$DATALAYER_DIR"/verify/supabase_auth.sql || exit 1
exit 0
