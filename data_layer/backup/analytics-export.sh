#!/bin/bash
# Export analytique de la prod, déjà filtré, pour le miroir `prod` de la base de
# stats (infra/data/prod-mirror/refresh-prod-mirror.sh). Trois fichiers, à clé
# fixe, dans le bucket d'export :
#
#   prod-schema.dump       définitions de toute la base, sans aucune donnée
#   prod-data.dump         données des schémas listés ci-dessous, sauf exclusions
#   prod-auth-users.csv    auth.users, colonnes listées ci-dessous seulement
#
# Le filtre est ici, à la source : le tier data, où le data analyst est
# autonome, ne reçoit jamais ni hash de mot de passe ni jeton. Les données
# fonctionnent en liste blanche : un nouveau schéma n'est pas exporté tant
# qu'il n'est pas ajouté ici.
set -euo pipefail

# Schémas dont les données partent dans le miroir.
SCHEMAS=(public historique labellisation notifications)

# Tables de ces schémas dont les données ne partent pas : secrets.
EXCLUDED_TABLES=(
  public.user_api_key                         # hashs des clés d'API
  public.utilisateur_identite_oidc_invitation # jetons d'invitation
)

# Colonnes d'auth.users exportées : ni encrypted_password, ni jetons, ni phone.
AUTH_USERS_COLUMNS="id, email, created_at, updated_at, last_sign_in_at, email_confirmed_at, invited_at, deleted_at, banned_until"

missing_vars=()
for var in FROM_DB_URL ANALYTICS_EXPORT_AWS_ACCESS_KEY_ID ANALYTICS_EXPORT_AWS_SECRET_ACCESS_KEY \
  ANALYTICS_EXPORT_BUCKET ANALYTICS_EXPORT_REGION ANALYTICS_EXPORT_ENDPOINT_URL; do
  [ -z "${!var:-}" ] && missing_vars+=("$var")
done
if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "Missing environment variables: ${missing_vars[*]}"
  exit 1
fi

# Même isolation de la CLI AWS que backup.sh (cf. aws-config).
export AWS_CONFIG_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/aws-config"
unset AWS_PROFILE AWS_DEFAULT_PROFILE

umask 077
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

schema_args=()
for schema in "${SCHEMAS[@]}"; do schema_args+=(--schema="$schema"); done
exclude_args=()
for table in "${EXCLUDED_TABLES[@]}"; do exclude_args+=(--exclude-table="$table"); done

echo "Dumping definitions..."
pg_dump "$FROM_DB_URL" \
  --format=custom --no-acl --no-owner --schema-only \
  -f "$WORK/prod-schema.dump"

echo "Dumping data of: ${SCHEMAS[*]}..."
pg_dump "$FROM_DB_URL" \
  --format=custom --no-acl --no-owner --data-only \
  "${schema_args[@]}" "${exclude_args[@]}" \
  -f "$WORK/prod-data.dump"

echo "Exporting auth.users ($AUTH_USERS_COLUMNS)..."
psql "$FROM_DB_URL" -X -v ON_ERROR_STOP=1 -q \
  -c "\\copy (select $AUTH_USERS_COLUMNS from auth.users) to '$WORK/prod-auth-users.csv' with (format csv, header)"

pg_restore --list "$WORK/prod-schema.dump" > /dev/null
pg_restore --list "$WORK/prod-data.dump" > /dev/null

# Garde : aucune table exclue dans le dump de données.
for table in "${EXCLUDED_TABLES[@]}"; do
  if pg_restore --list "$WORK/prod-data.dump" | grep -qE "TABLE DATA ${table%%.*} ${table#*.} "; then
    echo "Excluded table $table found in the data dump: aborting."
    exit 1
  fi
done

# Les données en dernier : le miroir, s'il tournait pendant l'envoi, échouerait
# sur un schéma plus récent que les données plutôt que l'inverse.
for file in prod-schema.dump prod-auth-users.csv prod-data.dump; do
  echo "Uploading $file..."
  AWS_ACCESS_KEY_ID="$ANALYTICS_EXPORT_AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$ANALYTICS_EXPORT_AWS_SECRET_ACCESS_KEY" \
  aws s3 cp "$WORK/$file" "s3://$ANALYTICS_EXPORT_BUCKET/$file" \
    --endpoint-url "$ANALYTICS_EXPORT_ENDPOINT_URL" \
    --region "$ANALYTICS_EXPORT_REGION" --only-show-errors
done

echo "Analytics export uploaded to s3://$ANALYTICS_EXPORT_BUCKET"
