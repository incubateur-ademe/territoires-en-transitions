#!/bin/bash
set -euo pipefail

if [ -z "${TO_DB_URL:-}" ]; then
    if [ -z "${CI:-}" ]; then
        TO_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
    else
        echo "Missing TO_DB_URL environment variable"
        exit 1
    fi
fi

if [[ $TO_DB_URL == *"rlarzronkgoyvtdkltqy"* ]]; then
    echo "Can't restore to production database"
    exit 1
fi

# Déterminer le fichier de backup à utiliser
if [ -z "${1:-}" ]; then
    # Pas d'argument : utiliser la date du jour (UTC), télécharger depuis S3
    DATE=$(date -u +%Y-%m-%d)
    echo "No argument provided, using today's date: $DATE"
    DOWNLOAD_FROM_S3=true
elif [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    # Argument au format date YYYY-MM-DD : télécharger depuis S3
    DATE="$1"
    DOWNLOAD_FROM_S3=true
else
    # Argument est un chemin de fichier local
    DUMP_FILE="$1"
    DOWNLOAD_FROM_S3=false
fi

if [ "$DOWNLOAD_FROM_S3" = true ]; then
    # Vérification des variables d'environnement S3
    missing_vars=()
    [ -z "${BACKUP_AWS_ACCESS_KEY_ID:-}" ] && missing_vars+=("BACKUP_AWS_ACCESS_KEY_ID")
    [ -z "${BACKUP_AWS_SECRET_ACCESS_KEY:-}" ] && missing_vars+=("BACKUP_AWS_SECRET_ACCESS_KEY")
    [ -z "${BACKUP_BUCKET:-}" ] && missing_vars+=("BACKUP_BUCKET")
    [ -z "${BACKUP_REGION:-}" ] && missing_vars+=("BACKUP_REGION")
    [ -z "${BACKUP_ENDPOINT_URL:-}" ] && missing_vars+=("BACKUP_ENDPOINT_URL")

    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "Missing environment variables for S3 download: ${missing_vars[*]}"
        exit 1
    fi

    BACKUP_FILE="backup-$DATE.dump"
    DUMP_FILE="/tmp/backups/$BACKUP_FILE"
    mkdir -p /tmp/backups

    echo "Downloading s3://$BACKUP_BUCKET/$BACKUP_FILE..."

    AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
    aws s3 cp "s3://$BACKUP_BUCKET/$BACKUP_FILE" "$DUMP_FILE" \
      --endpoint-url "$BACKUP_ENDPOINT_URL" \
      --region "$BACKUP_REGION"

    echo "Download complete."
fi

# Vérifier que le fichier existe et n'est pas vide
if [ ! -f "$DUMP_FILE" ]; then
    echo "Backup file not found: $DUMP_FILE"
    exit 1
fi

if [ ! -s "$DUMP_FILE" ]; then
    echo "Backup file is empty: $DUMP_FILE"
    exit 1
fi

echo "Restoring TO_DB_URL=$TO_DB_URL from $DUMP_FILE"
echo "Waiting for 10 seconds before starting the restore, please double check urls"
sleep 10

echo "Truncating tables..."
# Do auth apart because we can't truncate all tables
echo "Truncating auth.users..."
psql -d "$TO_DB_URL" -c "TRUNCATE TABLE auth.users CASCADE;"
# Get the list of tables and truncate each one
psql -d "$TO_DB_URL" -t -c "
  SELECT schemaname || '.' || tablename
  FROM pg_tables
  WHERE schemaname IN ('public', 'private', 'historique', 'labellisation', 'notifications', 'utilisateur', 'webhooks')
" | while read table; do
  if [ -n "$table" ]; then
    echo "Truncating $table..."
    psql -d "$TO_DB_URL" -c "TRUNCATE TABLE $table CASCADE;"
  fi
done

echo "Restoring data..."
echo "Restoring auth.users..."
pg_restore \
  --no-acl \
  --no-owner \
  --no-privileges \
  --data-only \
  -n auth \
  -t users \
  -d "$TO_DB_URL" \
  "$DUMP_FILE"

echo "Restoring other tables..."
pg_restore \
  --no-acl \
  --no-owner \
  --no-privileges \
  --data-only \
  -n public \
  -n private \
  -n historique \
  -n labellisation \
  -n notifications \
  -n utilisateur \
  -n webhooks \
  -d "$TO_DB_URL" \
  "$DUMP_FILE"

echo "Done!"
