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

# Allowlist of known non-prod restore targets.
# Fail-closed: TO_DB_URL must match a localhost shape or one of these project IDs.
# A misconfigured secret (e.g., accidentally pointing at production) is refused.
ALLOWED_PROJECT_IDS=(
    "qwbsrgwlypaqheoedxxq"  # staging
    "xbrefnclajfcjlpnwyow"  # preprod
)

is_allowed_target=false
if [[ "$TO_DB_URL" =~ (localhost|127\.0\.0\.1|host\.docker\.internal) ]]; then
    is_allowed_target=true
else
    for project_id in "${ALLOWED_PROJECT_IDS[@]}"; do
        if [[ "$TO_DB_URL" == *"$project_id"* ]]; then
            is_allowed_target=true
            break
        fi
    done
fi

if [ "$is_allowed_target" != true ]; then
    masked_url=$(echo "$TO_DB_URL" | sed 's|://[^@]*@|://***@|')
    echo "Refusing to restore: TO_DB_URL ($masked_url) does not match the allowlist."
    echo "Allowed targets: localhost shape, or one of: ${ALLOWED_PROJECT_IDS[*]}"
    exit 1
fi

# Sanity-check RESTORE_ENCRYPTED_PASSWORD shape when set.
# bcrypt hashes are exactly 60 chars and start with $2a$ / $2b$ / $2y$.
# Catches the common shell-expansion footgun where unquoted assignment in
# bash treats $<digit> as positional parameter expansion (e.g.
#   RESTORE_ENCRYPTED_PASSWORD=$2a$10$... bash restore.sh
# silently mangles the value to start with 'a' instead of $2a$10$).
if [ -n "${RESTORE_ENCRYPTED_PASSWORD:-}" ]; then
    pwd_len=${#RESTORE_ENCRYPTED_PASSWORD}
    if [ "$pwd_len" -ne 60 ] || ! [[ "$RESTORE_ENCRYPTED_PASSWORD" =~ ^\$2[aby]\$ ]]; then
        echo "Refusing to restore: RESTORE_ENCRYPTED_PASSWORD does not look like a bcrypt hash."
        echo "  Expected: 60 chars starting with \$2a\$ / \$2b\$ / \$2y\$"
        echo "  Got: '${RESTORE_ENCRYPTED_PASSWORD:0:8}...' ($pwd_len chars)"
        echo ""
        echo "  If you set the variable inline, single-quote it to prevent bash from"
        echo "  expanding \$<digit> sequences as positional parameters. Example:"
        echo "    RESTORE_ENCRYPTED_PASSWORD='\$2a\$10\$...' bash data_layer/backup/restore.sh"
        echo "  In a .env file, use single quotes or escape every \$."
        exit 1
    fi
fi

# Déterminer le fichier de backup à utiliser.
# Modes, par ordre de priorité :
#   - pas d'argument  → date du jour (UTC), télécharge depuis S3
#   - "latest"        → résout le backup S3 le plus récent et télécharge
#   - YYYY-MM-DD      → télécharge cette date depuis S3
#   - autre argument  → traité comme un chemin de fichier local
# Note : "pas d'argument" et "latest" sont distincts intentionnellement —
# "pas d'argument = aujourd'hui" est conservé pour l'usage local
# (./restore.sh tout court restaure le backup du jour). Les jobs CI
# passent toujours explicitement "latest" (staging) ou "YYYY-MM-DD" (preprod).
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

# Check host tools before downloading a potentially large backup or changing data.
required_commands=(psql pg_restore yq)
if [ "$DOWNLOAD_FROM_S3" = true ]; then
    required_commands+=(aws)
fi
for required_command in "${required_commands[@]}"; do
    if ! command -v "$required_command" > /dev/null 2>&1; then
        echo "Missing required command: $required_command."
        echo "Install the PostgreSQL client tools, yq and (for S3) AWS CLI; see README.md."
        exit 1
    fi
done

# Ignore local psql customizations, never prompt for a password, and propagate SQL errors.
PSQL=(psql -X --no-password -v ON_ERROR_STOP=1)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_CONFIG="$SCRIPT_DIR/restore-config.yml"

if [ ! -f "$RESTORE_CONFIG" ]; then
    echo "restore config not found: $RESTORE_CONFIG"
    exit 1
fi

# Group order: foundations before dependents; truncation uses the reverse order.
GROUP_ORDER=(
  technical_group
  stats_group
  collectivites_group
  indicateurs_group
  referentiels_group
  pai_group
  plans_group
)

# Parse every group and check every target table before the first TRUNCATE.
# Otherwise a missing table in a later group leaves the database partly emptied.
GROUP_TABLES=()
table_values=""
for group in "${GROUP_ORDER[@]}"; do
    if ! tables=$(yq -er ".groups.$group[]" "$RESTORE_CONFIG"); then
        echo "Could not read $group from $RESTORE_CONFIG. Check the configuration and yq installation."
        exit 1
    fi
    GROUP_TABLES+=("$tables")
    while IFS= read -r table; do
        if ! [[ "$table" =~ ^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$ ]]; then
            echo "Invalid table name in $group: $table"
            exit 1
        fi
        [[ "$table" == *.* ]] || table="public.$table"
        table_values+="${table_values:+,}('$table')"
    done <<< "$tables"
done

if ! missing_tables=$(PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}" "${PSQL[@]}" -d "$TO_DB_URL" -Atc \
    "SELECT name FROM (VALUES $table_values) AS requested(name) WHERE to_regclass(name) IS NULL;"); then
    echo "Cannot query the target database. For local restores, start and migrate it with make db-init."
    exit 1
fi
if [ -n "$missing_tables" ]; then
    echo "Target database is missing required tables. Apply migrations before restoring (locally: make db-init):"
    printf '%s\n' "$missing_tables"
    exit 1
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
        if ! backup_listing=$(AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
          AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
          aws s3 ls "s3://$BACKUP_BUCKET/" \
            --endpoint-url "$BACKUP_ENDPOINT_URL" \
            --region "$BACKUP_REGION"); then
            echo "Could not list backups in S3. Check the credentials and endpoint."
            exit 1
        fi
        LATEST_BACKUP=$(printf '%s\n' "$backup_listing" \
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

# Validate the archive with the installed client BEFORE truncating anything.
# In particular, older pg_restore versions cannot read newer dump formats.
if ! pg_restore --list "$DUMP_FILE" > /dev/null; then
    echo "Cannot read the backup archive. Check the file and pg_restore version; no tables were truncated."
    exit 1
fi

echo "Restoring to $(echo "$TO_DB_URL" | sed 's|://[^@]*@|://***@|') from $DUMP_FILE"
if [ -z "${CI:-}" ]; then
    echo "Waiting for 10 seconds before starting the restore, please double check urls"
    sleep 10
fi

# --- Truncation phase: reverse group order (dependents first) ---
echo "Truncating tables..."

for ((i=${#GROUP_ORDER[@]}-1; i>=0; i--)); do
    group="${GROUP_ORDER[$i]}"
    tables="${GROUP_TABLES[$i]}"

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
        "${PSQL[@]}" -d "$TO_DB_URL" -c "TRUNCATE TABLE \"$schema\".\"$table_name\" CASCADE;"
    done <<< "$tables"
done

# --- Restore phase: table-by-table using restore-config.yml groups ---
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

    # Extract tables for this group from restore-config.yml
    tables="${GROUP_TABLES[$((group_index - 1))]}"
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
        if echo "$RESTORED_TABLES" | grep -Fxq "$table_key"; then
            echo "  [$table_index/$table_count] Skipping $table_key (already restored)"
            TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
            continue
        fi

        table_start=$(date +%s)
        echo -n "  [$table_index/$table_count] Restoring $table_key..."

        # dcp is re-populated by auth.users triggers (which we can't disable — not table owner).
        # Re-truncate it before its restore.
        if [ "$table_key" = "public.dcp" ]; then
            "${PSQL[@]}" -d "$TO_DB_URL" -c "TRUNCATE TABLE \"$schema\".\"$table_name\" CASCADE;"
        fi

        # Disable user triggers before restore.
        # ALTER TABLE ... DISABLE TRIGGER USER requires table ownership.
        # On tables we don't own (e.g. auth.users), this fails — log a warning.
        triggers_disabled=false
        if "${PSQL[@]}" -d "$TO_DB_URL" -c "ALTER TABLE \"$schema\".\"$table_name\" DISABLE TRIGGER USER;" 2>/dev/null; then
            triggers_disabled=true
        else
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
        if [ "$triggers_disabled" = true ]; then
            "${PSQL[@]}" -d "$TO_DB_URL" -c "ALTER TABLE \"$schema\".\"$table_name\" ENABLE TRIGGER USER;"
        fi

        if [ -n "$restore_stderr" ]; then
            echo ""
            echo "    pg_restore output: $restore_stderr"
        fi

        if [ $restore_exit -ne 0 ]; then
            # Only tolerate the single, known PG < 17 preamble error. A failed
            # process without an "error:" line (killed, missing client, etc.)
            # must not be counted as a successful restore.
            harmless_error='pg_restore: error: could not execute query: ERROR:  unrecognized configuration parameter "transaction_timeout"'
            real_errors=$(echo "$restore_stderr" | grep -Ei '(error:|fatal:)' | grep -Fxv "$harmless_error" || true)
            if [ "$restore_exit" -ne 1 ] || [ -n "$real_errors" ] || \
               ! echo "$restore_stderr" | grep -Fxq "$harmless_error" || \
               ! echo "$restore_stderr" | grep -Fxq 'pg_restore: warning: errors ignored on restore: 1'; then
                echo "  FAILED"
                exit 1
            fi
        fi

        table_end=$(date +%s)
        table_duration=$((table_end - table_start))
        echo " OK (${table_duration}s)"

        RESTORED_TABLES+="$table_key"$'\n'
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

# --- Post-restore: reset sequences to match restored data ---
echo ""
echo "=== Resetting sequences ==="
"${PSQL[@]}" -d "$TO_DB_URL" -f "$SCRIPT_DIR/reset_sequences.sql"
echo "Sequences reset complete."

# --- Post-restore: anonymize sensitive columns (clean_data.sql) ---
# All scrubbing logic and post-scrub assertions live in clean_data.sql.
# RESTORE_ENCRYPTED_PASSWORD is forwarded as a psql variable; an empty value
# means "leave encrypted_password as restored" (used by local dev).
echo ""
echo "=== Cleaning sensitive data ==="
"${PSQL[@]}" -d "$TO_DB_URL" -v pwd="${RESTORE_ENCRYPTED_PASSWORD:-}" \
    -f "$SCRIPT_DIR/clean_data.sql"
echo "Sensitive data cleaning complete."

# --- Post-restore sanity checks ---
echo ""
echo "=== Post-restore sanity checks ==="
SANITY_ERRORS=0

SANITY_TABLES="collectivite dcp indicateur_valeur action_statut score_snapshot"

for table in $SANITY_TABLES; do
    count=$("${PSQL[@]}" -d "$TO_DB_URL" -Atc "SELECT count(*) FROM public.\"$table\";")
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
