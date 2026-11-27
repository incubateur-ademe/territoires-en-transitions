#!/usr/bin/env bash
# Reconstruit le schéma `prod` de la base de stats (miroir de la prod, J-1)
# depuis l'export analytique déposé chaque nuit par le job de backup
# (data_layer/backup/analytics-export.sh). Tourne sur le serveur data : aucune
# connexion vers la prod, seulement vers le bucket d'export et la RDB stats.
#
#   1. télécharge l'export (définitions, données, auth.users) ;
#   2. le restaure dans une base de travail jetable de la même instance, pour
#      que le schéma public de la prod ne rencontre jamais celui des stats ;
#   3. y construit `prod_next` : une table par table de la prod, nommée
#      <schéma>_<table> (prod.public_fiche_action, prod.auth_users…), sans
#      contrainte ni valeur par défaut, les types propres à la prod (enums,
#      types d'extension) ramenés à text ;
#   4. copie `prod_next` dans la base de stats, puis le bascule à la place de
#      `prod` en une transaction : les lecteurs voient l'ancien miroir jusqu'au
#      bout, jamais un miroir à moitié chargé.
#
# Variables :
#   STATS_DB_URL           URI admin de la base de stats (output pg_private_connection_uri)
#   EXPORT_BUCKET          bucket d'export (output analytics_export_bucket_name)
#   EXPORT_ACCESS_KEY, EXPORT_SECRET_KEY   clé de l'application IAM lectrice
#   EXPORT_REGION          (optionnel) défaut fr-par
#   EXPORT_DIR             (optionnel) export déjà sur disque : pas de téléchargement
#   READ_ROLES             (optionnel) rôles lecteurs du miroir, défaut "mcp_reader stats_writer"
#   BUILD_DB               (optionnel) base de travail, défaut prod_mirror_build
#   JOBS                   (optionnel) parallélisme du chargement, défaut 4
set -euo pipefail

: "${STATS_DB_URL:?STATS_DB_URL non défini}"
READ_ROLES="${READ_ROLES:-mcp_reader stats_writer}"
BUILD_DB="${BUILD_DB:-prod_mirror_build}"
EXPORT_REGION="${EXPORT_REGION:-fr-par}"
JOBS="${JOBS:-4}"

# Schémas de la prod repris dans le miroir, et auth.users. À garder aligné sur
# SCHEMAS de data_layer/backup/analytics-export.sh.
MIRROR_SCHEMAS="public historique labellisation notifications"

case "$-" in *x*)
  echo "✗ Refus de tourner en mode trace (set -x) : les mots de passe apparaîtraient." >&2
  exit 1
  ;;
esac

umask 077
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# URI de la base de travail : même instance, même rôle, autre base.
BUILD_DB_URL="$(printf '%s' "$STATS_DB_URL" | sed -E "s#^([a-z]+://[^/]+/)[^?]*#\\1${BUILD_DB}#")"
[ "$BUILD_DB_URL" != "$STATS_DB_URL" ] || {
  echo "✗ STATS_DB_URL : URI attendue sous la forme postgres://user:mot-de-passe@hôte:port/base." >&2
  exit 1
}

PSQL=(psql -X -q -v ON_ERROR_STOP=1)
export PGOPTIONS="-c client_min_messages=warning -c statement_timeout=0" PGCONNECT_TIMEOUT=10

# --- 1. Export ---
if [ -n "${EXPORT_DIR:-}" ]; then
  EXPORT="$EXPORT_DIR"
else
  : "${EXPORT_BUCKET:?EXPORT_BUCKET non défini}" "${EXPORT_ACCESS_KEY:?EXPORT_ACCESS_KEY non défini}" "${EXPORT_SECRET_KEY:?EXPORT_SECRET_KEY non défini}"
  EXPORT="$WORK"
  for file in prod-schema.dump prod-data.dump prod-auth-users.csv; do
    echo "→ Téléchargement de ${file}…"
    # Identifiants par un fichier de configuration, pas par argv.
    curl --fail --silent --show-error --config - \
      --aws-sigv4 "aws:amz:${EXPORT_REGION}:s3" \
      -o "$EXPORT/$file" \
      "https://${EXPORT_BUCKET}.s3.${EXPORT_REGION}.scw.cloud/${file}" <<CURL
user = "${EXPORT_ACCESS_KEY}:${EXPORT_SECRET_KEY}"
CURL
  done
fi
for file in prod-schema.dump prod-data.dump prod-auth-users.csv; do
  [ -s "$EXPORT/$file" ] || {
    echo "✗ Export incomplet : $EXPORT/$file introuvable ou vide." >&2
    exit 1
  }
done
echo "→ Export du $(pg_restore -l "$EXPORT/prod-data.dump" | sed -n 's/^; *Archive created at //p')"

# --- 2. Base de travail ---
echo "→ Base de travail ${BUILD_DB} recréée…"
"${PSQL[@]}" "$STATS_DB_URL" -c "DROP DATABASE IF EXISTS \"${BUILD_DB}\" WITH (FORCE)" -c "CREATE DATABASE \"${BUILD_DB}\""

# Définitions : la prod porte des extensions et des fonctions internes de
# Supabase que la RDB n'a pas. Leurs erreurs sont tolérées ici ; une table qui
# en dépendrait manquerait au chargement des données, qui, lui, s'arrête à la
# première erreur.
echo "→ Définitions…"
LC_ALL=C pg_restore --no-owner --no-acl --section=pre-data -d "$BUILD_DB_URL" "$EXPORT/prod-schema.dump" >"$WORK/schema.log" 2>&1 || true
echo "  $(grep -c '^pg_restore: error:' "$WORK/schema.log" || true) erreur(s) tolérée(s) sur les définitions"

echo "→ Données…"
pg_restore --no-owner --no-acl --data-only --exit-on-error --jobs="$JOBS" -d "$BUILD_DB_URL" "$EXPORT/prod-data.dump"

_columns="$(head -n1 "$EXPORT/prod-auth-users.csv")"
[[ "$_columns" =~ ^[a-z_,]+$ ]] || {
  echo "✗ En-tête inattendu dans prod-auth-users.csv." >&2
  exit 1
}
"${PSQL[@]}" "$BUILD_DB_URL" -c "\\copy auth.users ($_columns) from '$EXPORT/prod-auth-users.csv' with (format csv, header)"

# --- 3. prod_next ---
echo "→ Construction de prod_next…"
"${PSQL[@]}" "$BUILD_DB_URL" -v schemas="$MIRROR_SCHEMAS" <<'SQL'
-- pg_dump n'exporte pas par colonne : le téléphone est retiré ici, avant
-- publication (cf. data_layer/backup/clean_data.sql).
UPDATE public.dcp SET telephone = NULL WHERE telephone IS NOT NULL;

CREATE SCHEMA prod_next;

-- Une table par table de la prod, par CREATE TABLE AS : ni contrainte, ni
-- valeur par défaut, ni colonne générée, donc plus rien qui dépende des
-- fonctions et séquences de la prod. Un domaine reprend son type de base ; les
-- autres types hors pg_catalog (enums, ltree, vector…) deviennent text, ou
-- text[] pour leurs tableaux :
-- le miroir se copie alors seul dans la base de stats.
-- ponytail: pas d'index ni de clé primaire sur le miroir (comme l'ancien, chargé
-- par pandas). Si des requêtes d'analyse peinent, en créer ici après le CTAS.
SELECT format(
  'CREATE TABLE prod_next.%I AS SELECT %s FROM %I.%I',
  n.nspname || '_' || c.relname,
  string_agg(
    CASE
      WHEN tn.nspname = 'pg_catalog' AND coalesce(en.nspname, 'pg_catalog') = 'pg_catalog' THEN format('%I', a.attname)
      WHEN t.typtype = 'd' AND bn.nspname = 'pg_catalog' THEN format('%I::%s AS %I', a.attname, format_type(t.typbasetype, t.typtypmod), a.attname)
      WHEN t.typcategory = 'A' THEN format('%I::text[] AS %I', a.attname, a.attname)
      ELSE format('%I::text AS %I', a.attname, a.attname)
    END,
    ', ' ORDER BY a.attnum),
  n.nspname, c.relname)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
JOIN pg_type t ON t.oid = a.atttypid
JOIN pg_namespace tn ON tn.oid = t.typnamespace
LEFT JOIN pg_type e ON e.oid = t.typelem AND t.typcategory = 'A'
LEFT JOIN pg_namespace en ON en.oid = e.typnamespace
LEFT JOIN pg_type b ON b.oid = t.typbasetype AND t.typtype = 'd'
LEFT JOIN pg_namespace bn ON bn.oid = b.typnamespace
WHERE c.relkind IN ('r', 'p')
  AND NOT c.relispartition
  AND (n.nspname = ANY (string_to_array(:'schemas', ' ')) OR (n.nspname = 'auth' AND c.relname = 'users'))
GROUP BY n.nspname, c.relname
ORDER BY 1
\gexec

-- auth.users n'a reçu que les colonnes exportées : les autres sont vides.
DO $$
DECLARE col text;
BEGIN
  FOR col IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'prod_next' AND table_name = 'auth_users'
      AND column_name IN ('encrypted_password', 'phone', 'confirmation_token', 'recovery_token',
        'email_change_token_new', 'email_change_token_current', 'phone_change_token', 'reauthentication_token')
  LOOP
    EXECUTE format('ALTER TABLE prod_next.auth_users DROP COLUMN %I', col);
  END LOOP;
END $$;

-- Statistiques des seules tables du miroir (comptage ci-dessous).
SELECT format('ANALYZE prod_next.%I', tablename) FROM pg_tables WHERE schemaname = 'prod_next'
\gexec
SQL

_next_count="$("${PSQL[@]}" "$BUILD_DB_URL" -Atc "select count(*) from pg_tables where schemaname = 'prod_next'")"
_filled_count="$("${PSQL[@]}" "$BUILD_DB_URL" -Atc "select count(*) from pg_stat_user_tables where schemaname = 'prod_next' and n_live_tup > 0")"
echo "  ${_next_count} tables, dont ${_filled_count} non vides"

# Garde : un export tronqué ne remplace pas un miroir sain.
_current_count="$("${PSQL[@]}" "$STATS_DB_URL" -Atc "select count(*) from pg_tables where schemaname = 'prod'")"
if [ "$_next_count" -eq 0 ] || [ "$_filled_count" -eq 0 ] || [ $((_next_count * 10)) -lt $((_current_count * 9)) ]; then
  echo "✗ Miroir construit suspect : ${_next_count} tables (${_filled_count} non vides), contre ${_current_count} en place. Bascule annulée." >&2
  exit 1
fi

# --- 4. Copie dans stats, puis bascule ---
echo "→ Copie de prod_next dans la base de stats…"
"${PSQL[@]}" "$STATS_DB_URL" -c "DROP SCHEMA IF EXISTS prod_next CASCADE"
pg_dump --format=custom --no-owner --no-acl --schema=prod_next "$BUILD_DB_URL" \
  | pg_restore --no-owner --no-acl --exit-on-error -d "$STATS_DB_URL"

echo "→ Bascule…"
# Une transaction : en cas d'échec, l'ancien miroir reste en place. Les tables
# de l'ancien miroir tombent sans CASCADE : une vue posée dessus fait échouer
# la bascule plutôt que de disparaître en silence.
"${PSQL[@]}" "$STATS_DB_URL" -v roles="$READ_ROLES" <<'SQL'
BEGIN;
SET LOCAL lock_timeout = '60s';
SELECT set_config('mirror.roles', :'roles', true) AS _roles \gset
DO $$
DECLARE
  tbl text;
  role_name text;
BEGIN
  IF to_regnamespace('prod') IS NOT NULL THEN
    ALTER SCHEMA prod RENAME TO prod_old;
  END IF;
  ALTER SCHEMA prod_next RENAME TO prod;

  FOREACH role_name IN ARRAY string_to_array(current_setting('mirror.roles'), ' ') LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA prod TO %I', role_name);
    EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA prod TO %I', role_name);
  END LOOP;

  IF to_regnamespace('prod_old') IS NOT NULL THEN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'prod_old' LOOP
      EXECUTE format('DROP TABLE prod_old.%I', tbl);
    END LOOP;
    DROP SCHEMA prod_old;
  END IF;
END $$;
COMMIT;
SQL

"${PSQL[@]}" "$STATS_DB_URL" -c "DROP DATABASE IF EXISTS \"${BUILD_DB}\" WITH (FORCE)"
echo "✓ Miroir prod à jour : ${_next_count} tables."
