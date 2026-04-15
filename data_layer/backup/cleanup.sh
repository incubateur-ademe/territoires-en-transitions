#!/bin/bash
set -euo pipefail

# --- Configuration de la politique de rétention ---
# Nombre de jours où on garde tous les backups (1 par jour)
DAILY_RETENTION_DAYS="${DAILY_RETENTION_DAYS:-60}"
# Nombre de mois où on garde 1 backup par mois (au-delà de la période daily)
MONTHLY_RETENTION_MONTHS="${MONTHLY_RETENTION_MONTHS:-24}"
# Nombre minimum de backups à conserver (garde-fou)
MIN_BACKUP_COUNT="${MIN_BACKUP_COUNT:-1}"
# Mode simulation : affiche les actions sans supprimer
DRY_RUN="${DRY_RUN:-false}"

# Vérification des variables d'environnement requises
missing_vars=()
[ -z "${BACKUP_AWS_ACCESS_KEY_ID:-}" ] && missing_vars+=("BACKUP_AWS_ACCESS_KEY_ID")
[ -z "${BACKUP_AWS_SECRET_ACCESS_KEY:-}" ] && missing_vars+=("BACKUP_AWS_SECRET_ACCESS_KEY")
[ -z "${BACKUP_BUCKET:-}" ] && missing_vars+=("BACKUP_BUCKET")
[ -z "${BACKUP_REGION:-}" ] && missing_vars+=("BACKUP_REGION")
[ -z "${BACKUP_ENDPOINT_URL:-}" ] && missing_vars+=("BACKUP_ENDPOINT_URL")

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "Missing environment variables: ${missing_vars[*]}"
    exit 1
fi

# Fonction utilitaire pour les appels AWS S3
s3cmd() {
  AWS_ACCESS_KEY_ID="$BACKUP_AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$BACKUP_AWS_SECRET_ACCESS_KEY" \
  aws s3 "$@" \
    --endpoint-url "$BACKUP_ENDPOINT_URL" \
    --region "$BACKUP_REGION"
}

echo "=== Nettoyage des backups obsolètes ==="
echo "Politique : ${DAILY_RETENTION_DAYS}j quotidien, ${MONTHLY_RETENTION_MONTHS} mois mensuel, min ${MIN_BACKUP_COUNT} backups"
if [ "$DRY_RUN" = "true" ]; then
    echo "MODE DRY-RUN : aucune suppression ne sera effectuée"
fi

# Lister les fichiers du bucket
listing=$(s3cmd ls "s3://$BACKUP_BUCKET/")

if [ -z "$listing" ]; then
    echo "No backups found in bucket."
    exit 0
fi

# Extraire les noms de fichiers qui matchent le pattern backup-YYYY-MM-DD.dump
backups=()
while IFS= read -r line; do
    # Format de aws s3 ls : "2026-04-15 02:00:00  123456789 backup-2026-04-15.dump"
    filename=$(echo "$line" | awk '{print $NF}' | sed 's|.*/||')
    if [[ "$filename" =~ ^backup-([0-9]{4}-[0-9]{2}-[0-9]{2})\.dump$ ]]; then
        backups+=("${BASH_REMATCH[1]}")
    elif [[ "$filename" =~ ^backup-[0-9]{4}-[0-9]{2}-[0-9]{2}\.metadata\.json$ ]]; then
        # Metadata files are managed alongside their dump — skip silently
        :
    else
        if [ -n "$filename" ]; then
            echo "WARNING: fichier ignoré (pattern non reconnu) : $filename"
        fi
    fi
done <<< "$listing"

total_backups=${#backups[@]}
echo "Backups trouvés : $total_backups"

if [ "$total_backups" -le "$MIN_BACKUP_COUNT" ]; then
    echo "Nombre de backups ($total_backups) <= minimum ($MIN_BACKUP_COUNT). Aucune suppression."
    exit 0
fi

# Calculer les dates seuils (UTC)
today=$(date -u +%Y-%m-%d)
if [[ "$(uname)" == "Darwin" ]]; then
    daily_cutoff=$(date -u -v-${DAILY_RETENTION_DAYS}d +%Y-%m-%d)
    monthly_cutoff=$(date -u -v-${MONTHLY_RETENTION_MONTHS}m +%Y-%m-%d)
else
    daily_cutoff=$(date -u -d "$today - ${DAILY_RETENTION_DAYS} days" +%Y-%m-%d)
    monthly_cutoff=$(date -u -d "$today - ${MONTHLY_RETENTION_MONTHS} months" +%Y-%m-%d)
fi

echo "Date du jour (UTC) : $today"
echo "Seuil quotidien    : $daily_cutoff (backups >= cette date sont conservés)"
echo "Seuil mensuel      : $monthly_cutoff (1 par mois entre les deux seuils)"

# Classer chaque backup
# On trie par date croissante pour que le premier backup d'un mois soit le plus ancien
IFS=$'\n' sorted_asc=($(printf '%s\n' "${backups[@]}" | sort)); unset IFS

final_keep=()
final_delete=()
# Liste des mois déjà représentés (compatible bash 3, pas de declare -A)
seen_months=""

for backup_date in "${sorted_asc[@]}"; do
    if [[ ! "$backup_date" < "$daily_cutoff" ]]; then
        # Période récente : on garde tout
        final_keep+=("$backup_date")
    elif [[ ! "$backup_date" < "$monthly_cutoff" ]]; then
        # Période mensuelle : garder le premier (plus ancien) backup de chaque mois
        month="${backup_date:0:7}" # YYYY-MM
        if [[ "$seen_months" != *"$month"* ]]; then
            seen_months="$seen_months $month"
            final_keep+=("$backup_date")
        else
            final_delete+=("$backup_date")
        fi
    else
        # Au-delà de la rétention mensuelle : supprimer
        final_delete+=("$backup_date")
    fi
done

# Garde-fou : vérifier qu'on ne descend pas sous le minimum
keep_count=0
delete_count=0
for _ in ${final_keep[@]+"${final_keep[@]}"}; do keep_count=$((keep_count + 1)); done
for _ in ${final_delete[@]+"${final_delete[@]}"}; do delete_count=$((delete_count + 1)); done

if [ "$keep_count" -lt "$MIN_BACKUP_COUNT" ]; then
    echo "WARNING: seulement $keep_count backups seraient conservés (minimum: $MIN_BACKUP_COUNT)."
    echo "Aucune suppression effectuée par sécurité."
    exit 0
fi

echo ""
echo "Backups à conserver : $keep_count"
for d in ${final_keep[@]+"${final_keep[@]}"}; do echo "  KEEP   backup-$d.dump"; done

echo ""
echo "Backups à supprimer : $delete_count"
for d in ${final_delete[@]+"${final_delete[@]}"}; do echo "  DELETE backup-$d.dump"; done

if [ "$delete_count" -eq 0 ]; then
    echo "Rien à supprimer."
    exit 0
fi

# Suppression
has_error=false
for backup_date in "${final_delete[@]}"; do
    file="backup-$backup_date.dump"
    metadata_file="backup-$backup_date.metadata.json"
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY-RUN] Suppression de $file"
        echo "[DRY-RUN] Suppression de $metadata_file (si existant)"
    else
        echo "Suppression de $file..."
        if ! s3cmd rm "s3://$BACKUP_BUCKET/$file"; then
            echo "ERROR: échec de la suppression de $file"
            has_error=true
        fi
        # Supprimer le fichier metadata associé (peut ne pas exister pour les anciens backups)
        s3cmd rm "s3://$BACKUP_BUCKET/$metadata_file" 2>/dev/null || true
    fi
done

if [ "$DRY_RUN" = "true" ]; then
    echo ""
    echo "DRY-RUN terminé. Aucun fichier supprimé."
else
    echo ""
    echo "Nettoyage terminé. $delete_count backup(s) supprimé(s)."
fi

if [ "$has_error" = "true" ]; then
    echo "WARNING: certaines suppressions ont échoué."
    exit 1
fi
