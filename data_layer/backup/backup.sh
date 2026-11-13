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

# Isole la CLI AWS de ~/.aws/config et force le client de transfert S3 classique
# (cf. aws-config). AWS_PROFILE est retiré : un profil absent de ce fichier ferait
# échouer la CLI.
export AWS_CONFIG_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/aws-config"
unset AWS_PROFILE AWS_DEFAULT_PROFILE

# put-object plutôt que `s3 cp` : le bucket est sous Object Lock, et un upload
# vers un bucket verrouillé exige un Content-MD5 que `s3 cp` n'envoie pas
# toujours. Limite d'un PUT simple : 5 Go.
upload() {
  local file="$1"
  local size
  size=$(wc -c < "$file" | tr -d " ")
  if [ "$size" -ge 5000000000 ]; then
    echo "$file fait $size octets, au-delà des 5 Go d'un PUT simple : passer à un upload multipart."
    exit 1
  fi
  AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
  aws s3api put-object \
    --bucket "$BACKUP_BUCKET" --key "$(basename "$file")" \
    --body "$file" \
    --content-md5 "$(openssl md5 -binary "$file" | base64)" \
    --endpoint-url "$BACKUP_ENDPOINT_URL" \
    --region "$BACKUP_REGION" > /dev/null
}

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
upload "$BACKUP_DIRECTORY/$BACKUP_FILE"

echo "Backup uploaded to s3://$BACKUP_BUCKET/$BACKUP_FILE"

# --- Metadata: backend version ---
BACKEND_URL="${BACKEND_URL:-https://api.territoiresentransitions.fr}"
METADATA_FILE="backup-$DATE.metadata.json"

echo "Fetching backend version from $BACKEND_URL/version..."

curl -sf "$BACKEND_URL/version" -o "$BACKUP_DIRECTORY/$METADATA_FILE"

echo "Uploading metadata to S3..."

upload "$BACKUP_DIRECTORY/$METADATA_FILE"

echo "Metadata uploaded to s3://$BACKUP_BUCKET/$METADATA_FILE"
