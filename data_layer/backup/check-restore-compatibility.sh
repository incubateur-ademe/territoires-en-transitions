#!/bin/bash
set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "${TO_DB_URL:-}" ]; then
    echo "Usage: TO_DB_URL=... $0 <backup.dump>" >&2
    exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_FILE="$1"
PSQL=(psql -X --no-password --set ON_ERROR_STOP=1 --dbname "$TO_DB_URL")

# This release restores only the final schema. Historical backups need their
# matching application/schema release before being migrated forward.
if [ "$("${PSQL[@]}" -Atc "
    SELECT count(DISTINCT change) = 3 FROM sqitch.changes
    WHERE project = 'tet' AND change IN (
        'indicateur/periodicite_activation', 'indicateur/margny_indicateurs_mensuels',
        'indicateur/periodicite_nettoyage'
    );")" != t ]; then
    echo "Refusing to restore: target must have the activated and cleaned schema." >&2
    exit 1
fi

# Reuse the actual SQL contracts instead of duplicating intermediate states.
# Explicitly enable assertions even if the server disabled them globally.
verify_args=(--command='SET plpgsql.check_asserts = on;')
for change in periodicite periodicite_obligatoire periodicite_formules \
              reconciliation_formules reserver-ecriture-valeurs-backend \
              periodicite_activation margny_indicateurs_mensuels periodicite_nettoyage; do
    verify_args+=(--file="$SCRIPT_DIR/../sqitch/verify/indicateur/$change.sql")
done
"${PSQL[@]}" "${verify_args[@]}" > /dev/null

# Inspect Sqitch's registry from the same pg_dump snapshot as the data.
# pipefail also rejects an unreadable or truncated archive.
if ! pg_restore --data-only --schema=sqitch --table=changes --file=- "$DUMP_FILE" \
    | awk -F '\t' '
        /^COPY sqitch.changes / { copying = 1; next }
        /^\\\.$/ { copying = 0 }
        copying && $4 == "tet" {
            if ($3 == "indicateur/periodicite_activation") activated = 1
            if ($3 == "indicateur/margny_indicateurs_mensuels") margny = 1
            if ($3 == "indicateur/periodicite_nettoyage") cleaned = 1
        }
        END { exit !(activated && margny && cleaned) }
    '; then
    echo "Refusing to restore: backup must contain the activated and cleaned Sqitch registry." >&2
    echo "Restore historical backups with their matching application and schema release." >&2
    exit 1
fi

# The queue is durable business work; a missing TABLE DATA entry would erase
# pending recalculations. An empty but present queue is valid.
if ! pg_restore --list "$DUMP_FILE" \
    | awk '$4 == "TABLE" && $5 == "DATA" && $6 == "private" \
             && $7 == "indicateur_reconciliation_formule" { found = 1 }
           END { exit !found }'; then
    echo "Refusing to restore: backup lacks formula reconciliation data or is unreadable." >&2
    exit 1
fi

echo "Restore compatibility: final schema verified." >&2
