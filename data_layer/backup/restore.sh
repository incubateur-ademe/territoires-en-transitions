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

# Déterminer le fichier de backup à utiliser.
# Modes, par ordre de priorité :
#   - pas d'argument  → date du jour (UTC), télécharge depuis S3
#   - "latest"        → résout le backup S3 le plus récent et télécharge
#   - YYYY-MM-DD      → télécharge cette date depuis S3
#   - autre argument  → traité comme un chemin de fichier local
# Note : "pas d'argument" et "latest" sont distincts intentionnellement —
# le job nocturne validate-restore repose sur "pas d'argument = aujourd'hui".
if [ -z "${1:-}" ]; then
    DATE=$(date -u +%Y-%m-%d)
    echo "No argument provided, using today's date: $DATE"
    DOWNLOAD_FROM_S3=true
    RESOLVE_LATEST=false
elif [ "$1" = "latest" ]; then
    echo "Argument 'latest' provided, will resolve most recent backup from S3"
    DOWNLOAD_FROM_S3=true
    RESOLVE_LATEST=true
elif [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    DATE="$1"
    DOWNLOAD_FROM_S3=true
    RESOLVE_LATEST=false
else
    DUMP_FILE="$1"
    DOWNLOAD_FROM_S3=false
    RESOLVE_LATEST=false
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

    # Mode "latest" : lister le bucket et choisir le backup avec la date la plus récente.
    # Le pattern ancré (^...$) rejette les noms non-standards tels que backup-2026-04-18-partial.dump.
    if [ "$RESOLVE_LATEST" = true ]; then
        LATEST_BACKUP=$(AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
          AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
          aws s3 ls "s3://$BACKUP_BUCKET/" \
            --endpoint-url "$BACKUP_ENDPOINT_URL" \
            --region "$BACKUP_REGION" \
          | awk '{print $NF}' \
          | grep -E '^backup-[0-9]{4}-[0-9]{2}-[0-9]{2}\.dump$' \
          | sort \
          | tail -1 || true)

        if [ -z "$LATEST_BACKUP" ]; then
            echo "No backup files found in s3://$BACKUP_BUCKET/ (endpoint: $BACKUP_ENDPOINT_URL)"
            exit 1
        fi

        DATE=$(echo "$LATEST_BACKUP" | sed -E 's/^backup-([0-9]{4}-[0-9]{2}-[0-9]{2})\.dump$/\1/')
        echo "Latest backup resolved to: $DATE"
    fi

    BACKUP_FILE="backup-$DATE.dump"
    DUMP_FILE="/tmp/backups/$BACKUP_FILE"
    mkdir -p /tmp/backups

    echo "Downloading s3://$BACKUP_BUCKET/$BACKUP_FILE..."

    if ! AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
         AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
         aws s3 cp "s3://$BACKUP_BUCKET/$BACKUP_FILE" "$DUMP_FILE" \
           --endpoint-url "$BACKUP_ENDPOINT_URL" \
           --region "$BACKUP_REGION"; then
        echo ""
        echo "Download failed for s3://$BACKUP_BUCKET/$BACKUP_FILE"
        echo "Most recent backups available in the bucket:"
        AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
        aws s3 ls "s3://$BACKUP_BUCKET/" \
          --endpoint-url "$BACKUP_ENDPOINT_URL" \
          --region "$BACKUP_REGION" 2>/dev/null \
          | awk '{print $NF}' \
          | grep -E '^backup-[0-9]{4}-[0-9]{2}-[0-9]{2}\.dump$' \
          | sort \
          | tail -5 \
          | sed 's/^/  - /' || true
        exit 1
    fi

    echo "Download complete."

    # Fetch backup metadata (non-fatal — older backups may not have it)
    METADATA_FILE="/tmp/backups/backup-$DATE.metadata.json"
    echo "Fetching backup metadata..."
    if AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
       AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
       aws s3 cp "s3://$BACKUP_BUCKET/backup-$DATE.metadata.json" "$METADATA_FILE" \
         --endpoint-url "$BACKUP_ENDPOINT_URL" \
         --region "$BACKUP_REGION" 2>/dev/null; then
        echo "=== Backup Metadata ==="
        cat "$METADATA_FILE"
        echo ""
        echo "========================"
    else
        echo "No metadata file found (older backup). Continuing..."
    fi
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

# --- Parse .pgsync.yml for group/table definitions ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGSYNC_YML="$SCRIPT_DIR/../pgsync/.pgsync.yml"

if [ ! -f "$PGSYNC_YML" ]; then
    echo "pgsync config not found: $PGSYNC_YML"
    exit 1
fi

if ! command -v yq &> /dev/null; then
    echo "yq is required but not installed."
    echo "  macOS: brew install yq"
    echo "  Linux: sudo snap install yq"
    exit 1
fi

# Group order follows sync-databases.sh convention
GROUP_ORDER=(
  technical_group
  stats_group
  collectivites_group
  indicateurs_group
  referentiels_group
  pai_group
  plans_group
)

echo "Restoring to $(echo "$TO_DB_URL" | sed 's|://[^@]*@|://***@|') from $DUMP_FILE"
if [ -z "${CI:-}" ]; then
    echo "Waiting for 10 seconds before starting the restore, please double check urls"
    sleep 10
fi

# --- Truncation phase: reverse group order (dependents first) ---
echo "Truncating tables..."

REVERSE_GROUP_ORDER=()
for ((i=${#GROUP_ORDER[@]}-1; i>=0; i--)); do
    REVERSE_GROUP_ORDER+=("${GROUP_ORDER[$i]}")
done

for group in "${REVERSE_GROUP_ORDER[@]}"; do
    tables=$(yq -r ".groups.$group[]" "$PGSYNC_YML" 2>/dev/null)
    [ -z "$tables" ] && continue

    echo "Truncating $group..."
    while IFS= read -r table; do
        [ -z "$table" ] && continue

        if [[ "$table" == *.* ]]; then
            schema="${table%%.*}"
            table_name="${table#*.}"
        else
            schema="public"
            table_name="$table"
        fi

        echo "  Truncating $schema.$table_name..."
        psql -d "$TO_DB_URL" -c "TRUNCATE TABLE \"$schema\".\"$table_name\" CASCADE;"
    done <<< "$tables"
done

# --- Restore phase: table-by-table using pgsync groups ---
echo ""
echo "Restoring data table-by-table..."

RESTORED_TABLES=""
TOTAL_RESTORED=0
TOTAL_SKIPPED=0
RESTORE_START=$(date +%s)

group_index=0
total_groups=${#GROUP_ORDER[@]}

for group in "${GROUP_ORDER[@]}"; do
    group_index=$((group_index + 1))

    # Extract tables for this group from .pgsync.yml
    tables=$(yq -r ".groups.$group[]" "$PGSYNC_YML" 2>/dev/null)
    if [ -z "$tables" ]; then
        echo "=== Group $group_index/$total_groups: $group (0 tables — skipping) ==="
        continue
    fi

    table_count=$(echo "$tables" | wc -l | tr -d ' ')
    echo ""
    echo "=== Group $group_index/$total_groups: $group ($table_count tables) ==="

    table_index=0
    while IFS= read -r table; do
        # Skip empty lines and comments
        [ -z "$table" ] && continue

        table_index=$((table_index + 1))

        # Normalize table name: split schema.table or default to public
        if [[ "$table" == *.* ]]; then
            schema="${table%%.*}"
            table_name="${table#*.}"
        else
            schema="public"
            table_name="$table"
        fi

        table_key="$schema.$table_name"

        # Deduplication: skip tables already restored in a previous group
        if echo "$RESTORED_TABLES" | grep -q "^${table_key}$"; then
            echo "  [$table_index/$table_count] Skipping $table_key (already restored)"
            TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
            continue
        fi

        table_start=$(date +%s)
        echo -n "  [$table_index/$table_count] Restoring $table_key..."

        # dcp is re-populated by auth.users triggers (which we can't disable — not table owner).
        # Re-truncate it before its restore.
        if [ "$table_key" = "public.dcp" ]; then
            psql -d "$TO_DB_URL" -c "TRUNCATE TABLE \"$schema\".\"$table_name\" CASCADE;"
        fi

        # Disable user triggers before restore (same approach as pgsync).
        # ALTER TABLE ... DISABLE TRIGGER USER requires table ownership.
        # On tables we don't own (e.g. auth.users), this fails — log a warning.
        if ! psql -d "$TO_DB_URL" -c "ALTER TABLE \"$schema\".\"$table_name\" DISABLE TRIGGER USER;" 2>/dev/null; then
            echo -n " (warning: could not disable triggers — not table owner)"
        fi

        # Don't use --exit-on-error or --single-transaction: pg_restore executes
        # SET statements from the dump preamble (e.g. SET transaction_timeout = 0)
        # which fail on older PostgreSQL versions. With --single-transaction, this
        # aborts the entire transaction and no data gets restored.
        # We check for real data errors manually instead.
        set +e
        restore_stderr=$(pg_restore \
          --no-acl \
          --no-owner \
          --no-privileges \
          --data-only \
          -n "$schema" \
          -t "$table_name" \
          -d "$TO_DB_URL" \
          "$DUMP_FILE" 2>&1)
        restore_exit=$?
        set -e

        # Re-enable user triggers after restore
        if ! psql -d "$TO_DB_URL" -c "ALTER TABLE \"$schema\".\"$table_name\" ENABLE TRIGGER USER;" 2>/dev/null; then
            true # Already warned above, no need to repeat
        fi

        if [ -n "$restore_stderr" ]; then
            echo ""
            echo "    pg_restore output: $restore_stderr"
        fi

        if [ $restore_exit -ne 0 ]; then
            # Filter out known harmless errors (transaction_timeout on PG < 17)
            real_errors=$(echo "$restore_stderr" | grep -i "error:" | grep -v "transaction_timeout" || true)
            if [ -n "$real_errors" ]; then
                echo "  FAILED"
                exit 1
            fi
        fi

        table_end=$(date +%s)
        table_duration=$((table_end - table_start))
        echo " OK (${table_duration}s)"

        RESTORED_TABLES="$RESTORED_TABLES
$table_key"
        TOTAL_RESTORED=$((TOTAL_RESTORED + 1))
    done <<< "$tables"
done

RESTORE_END=$(date +%s)
TOTAL_DURATION=$((RESTORE_END - RESTORE_START))
TOTAL_MINUTES=$((TOTAL_DURATION / 60))
TOTAL_SECONDS=$((TOTAL_DURATION % 60))

echo ""
echo "=== Restore Summary ==="
echo "Groups: $total_groups/$total_groups"
echo "Tables restored: $TOTAL_RESTORED"
echo "Tables skipped (duplicates): $TOTAL_SKIPPED"
echo "Total time: ${TOTAL_MINUTES}m${TOTAL_SECONDS}s"
echo "Done!"

# --- Post-restore: reset sequences to match restored data ---
echo ""
echo "=== Resetting sequences ==="
psql -d "$TO_DB_URL" -f "$SCRIPT_DIR/reset_sequences.sql"
echo "Sequences reset complete."

# --- Post-restore sanity checks ---
echo ""
echo "=== Post-restore sanity checks ==="
SANITY_ERRORS=0

SANITY_TABLES="collectivite dcp indicateur_valeur action_statut score_snapshot"

for table in $SANITY_TABLES; do
    count=$(psql -d "$TO_DB_URL" -t -c "SELECT count(*) FROM public.\"$table\";" 2>/dev/null | tr -d ' ')
    if [ -z "$count" ] || [ "$count" -eq 0 ]; then
        echo "  FAIL: $table has 0 rows"
        SANITY_ERRORS=$((SANITY_ERRORS + 1))
    else
        echo "  OK: $table has $count rows"
    fi
done

if [ $SANITY_ERRORS -gt 0 ]; then
    echo "Sanity check failed: $SANITY_ERRORS table(s) empty after restore"
    exit 1
fi

echo "All sanity checks passed."
