#!/bin/bash
set -euo pipefail

DATE=$(date -u +%Y-%m-%d)
BACKUP_DIRECTORY="/tmp/backups"
BACKUP_FILE="backup-$DATE.dump"

# Vérification des variables d'environnement requises
missing_vars=()
[ -z "${FROM_DB_URL:-}" ] && missing_vars+=("FROM_DB_URL")
[ -z "${BACKUP_AWS_ACCESS_KEY_ID:-}" ] && missing_vars+=("BACKUP_AWS_ACCESS_KEY_ID")
[ -z "${BACKUP_AWS_SECRET_ACCESS_KEY:-}" ] && missing_vars+=("BACKUP_AWS_SECRET_ACCESS_KEY")
[ -z "${BACKUP_BUCKET:-}" ] && missing_vars+=("BACKUP_BUCKET")
[ -z "${BACKUP_REGION:-}" ] && missing_vars+=("BACKUP_REGION")
[ -z "${BACKUP_ENDPOINT_URL:-}" ] && missing_vars+=("BACKUP_ENDPOINT_URL")

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "Missing environment variables: ${missing_vars[*]}"
    exit 1
fi

mkdir -p "$BACKUP_DIRECTORY"

echo "Starting backup to $BACKUP_DIRECTORY/$BACKUP_FILE..."

# Dump compressé
# Format binaire compressé, plus fiable que --format=plain
# Ignore les permissions (souvent inutiles à restaurer)
# Ignore les owners (le user de destination sera owner)
# -c transaction_timeout= prevents pg_dump from including SET transaction_timeout
# which causes errors when restoring to older PostgreSQL versions
PGOPTIONS="-c transaction_timeout=" pg_dump "$FROM_DB_URL" \
  --format=custom \
  --no-acl \
  --no-owner \
  -f "$BACKUP_DIRECTORY/$BACKUP_FILE"

echo "Dump completed. Verifying backup integrity..."

# Vérification de l'intégrité du dump avant upload
pg_restore --list "$BACKUP_DIRECTORY/$BACKUP_FILE" > /dev/null

echo "Backup verified. Uploading to S3..."

# Upload vers S3
AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
aws s3 cp "$BACKUP_DIRECTORY/$BACKUP_FILE" \
  "s3://$BACKUP_BUCKET/$BACKUP_FILE" \
  --endpoint-url "$BACKUP_ENDPOINT_URL" \
  --region "$BACKUP_REGION"

echo "Backup uploaded to s3://$BACKUP_BUCKET/$BACKUP_FILE"

# --- Metadata: backend version ---
BACKEND_URL="${BACKEND_URL:-https://api.territoiresentransitions.fr}"
METADATA_FILE="backup-$DATE.metadata.json"

echo "Fetching backend version from $BACKEND_URL/version..."

curl -sf "$BACKEND_URL/version" -o "$BACKUP_DIRECTORY/$METADATA_FILE"

echo "Uploading metadata to S3..."

AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
aws s3 cp "$BACKUP_DIRECTORY/$METADATA_FILE" \
  "s3://$BACKUP_BUCKET/$METADATA_FILE" \
  --endpoint-url "$BACKUP_ENDPOINT_URL" \
  --region "$BACKUP_REGION"

echo "Metadata uploaded to s3://$BACKUP_BUCKET/$METADATA_FILE"
