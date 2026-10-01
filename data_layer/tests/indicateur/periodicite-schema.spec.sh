#!/usr/bin/env bash
set -euo pipefail
url="${PERIODICITE_SCHEMA_TEST_DATABASE_URL:?Use an empty disposable local database}"
DATABASE_URL="$url" node --input-type=module <<'JS'
const u = new URL(process.env.DATABASE_URL);
if (!['postgres:', 'postgresql:'].includes(u.protocol) ||
    !['localhost','127.0.0.1','[::1]'].includes(u.hostname) || u.search || u.hash ||
    !/^\/periodicite_schema_test_[a-z0-9_]+$/.test(u.pathname)) process.exit(2);
JS
empty=$(psql -X --no-password -v ON_ERROR_STOP=1 -At --dbname="$url" -c "SELECT to_regclass('public.indicateur_definition') IS NULL AND to_regclass('public.indicateur_valeur') IS NULL")
[[ "$empty" == t ]] || { echo 'Refusing a database with existing indicator tables' >&2; exit 2; }
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pg_prove --dbname="$url" --ext .psql --verbose "$script_dir/periodicite-schema.assertions.psql"
