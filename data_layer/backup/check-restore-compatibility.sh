#!/bin/bash
set -euo pipefail
: "${TO_DB_URL:?Missing TO_DB_URL}"
[[ "$#" -ge 2 ]] || { echo 'Usage: TO_DB_URL=... check-restore-compatibility.sh backup.dump schema.table [...]' >&2; exit 2; }

archive="$1"
shift
workspace=$(mktemp -d)
trap 'rm -rf "$workspace"' EXIT
export LC_ALL=C

# restore.sh supplies the exact table list it reads from restore-config.yml.
# Restrict names before using them in SQL; never execute SQL from the archive.
for table in "$@"; do
    if ! [[ "$table" =~ ^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$ ]]; then
        echo "Invalid restore table: $table" >&2
        exit 2
    fi
    printf '%s\n' "$table"
done | sort -u > "$workspace/required-tables"

pg_restore --list "$archive" > "$workspace/toc"
awk '$4 == "TABLE" && $5 == "DATA" { print $6 "." $7 }' "$workspace/toc" \
    | sort -u > "$workspace/archive-tables"
comm -23 "$workspace/required-tables" "$workspace/archive-tables" > "$workspace/missing-tables"
if [[ -s "$workspace/missing-tables" ]]; then
    echo 'Refusing to restore: backup lacks TABLE DATA for required tables:' >&2
    cat "$workspace/missing-tables" >&2
    exit 1
fi
if ! grep -Fxq 'sqitch.changes' "$workspace/archive-tables"; then
    echo 'Refusing to restore: backup lacks the Sqitch registry.' >&2
    exit 1
fi

# Compare migration identities only. change_id already hashes the plan entry
# (name, parent, dependencies, planner, note); script_hash is left out because
# deploy scripts edited in place after their deployment keep their old hash in
# long-lived databases and a new one in freshly built databases.
# Extra/missing migrations require an aligned schema before restoring any data.
if ! pg_restore --data-only --schema=sqitch --table=changes --file=- "$archive" \
    | awk -F '\t' '
        /^COPY sqitch\.changes \(/ {
            columns = $0
            sub(/^COPY sqitch\.changes \(/, "", columns)
            sub(/\) FROM stdin;$/, "", columns)
            count = split(columns, names, ", ")
            for (i = 1; i <= count; i++) {
                gsub(/"/, "", names[i])
                positions[names[i]] = i
            }
            if (!positions["project"] || !positions["change_id"]) exit 1
            copying = 1
            blocks++
            next
        }
        copying && $0 == "\\." { copying = 0; next }
        copying {
            if (NF != count || $(positions["project"]) == "" || $(positions["project"]) == "\\N" ||
                $(positions["change_id"]) == "" || $(positions["change_id"]) == "\\N") exit 1
            print $(positions["project"]) "\t" $(positions["change_id"])
            rows++
        }
        END { if (blocks != 1 || copying || !rows) exit 1 }
    ' | sort > "$workspace/source-changes"; then
    echo 'Refusing to restore: unreadable or empty Sqitch registry data (COPY format required).' >&2
    exit 1
fi

psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --dbname="$TO_DB_URL" \
    --command='COPY (SELECT project, change_id FROM sqitch.changes) TO STDOUT' \
    | sort > "$workspace/target-changes"
if ! cmp -s "$workspace/source-changes" "$workspace/target-changes"; then
    echo 'Refusing to restore: backup and target have different Sqitch migrations.' >&2
    echo 'Use a backup and target at the same migration state; no tables were truncated.' >&2
    exit 1
fi

# The registry cannot detect manual schema drift. Check at least that every
# requested data table physically exists; views and foreign tables are refused.
while IFS= read -r table; do
    printf "SELECT '%s' WHERE NOT EXISTS (SELECT FROM pg_class WHERE oid = to_regclass('%s') AND relkind IN ('r', 'p'));\n" "$table" "$table"
done < "$workspace/required-tables" > "$workspace/check-tables.sql"
psql --no-psqlrc --no-password --set ON_ERROR_STOP=1 --tuples-only --no-align \
    --dbname="$TO_DB_URL" --file="$workspace/check-tables.sql" > "$workspace/missing-target-tables"
if [[ -s "$workspace/missing-target-tables" ]]; then
    echo 'Refusing to restore: target lacks required data tables:' >&2
    cat "$workspace/missing-target-tables" >&2
    exit 1
fi
printf '%s\n' 'Restore preflight passed: matching Sqitch state and required tables present.'
