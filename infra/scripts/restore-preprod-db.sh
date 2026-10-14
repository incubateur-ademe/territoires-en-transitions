#!/usr/bin/env bash
# Restaure un dump complet (schéma + données) de Supabase Cloud dans la RDB
# Scaleway de preprod. Répétition de la bascule : même chemin que le jour J,
# avec en plus l'anonymisation de data_layer/backup/clean_data.sql.
#
# Différences avec data_layer/backup/restore.sh (data-only, ADR 0016) :
#   - le schéma vient du dump, pas de Sqitch : rejouer toutes les migrations
#     sur Scaleway bute sur des extensions absentes (pg_net, http…) ;
#   - tout le schéma auth est repris (sessions, identities, refresh tokens,
#     MFA), pas seulement auth.users. GoTrue reprend ensuite ses migrations
#     depuis auth.schema_migrations du dump.
#
# La cible est lue dans les outputs de infra/nonprod : ce script ne sait pas
# viser la prod. Lancer via `make -C infra/nonprod restore-preprod-db d=<dump>`.
#
# Ordre (les FK de public pointent vers la clé primaire d'auth.users, les
# triggers d'auth.users appellent des fonctions des schémas applicatifs) :
#   1. préparation : auth, storage et extensions repartent de zéro, 001 / 002 ;
#   2. auth, définitions et données, en supabase_auth_admin, puis anonymisé ;
#   3. le reste, définitions et données, --clean --if-exists (rejouable), en
#      tet_admin, puis clean_data.sql ;
#   4. auth, index, contraintes et triggers, en supabase_auth_admin ;
#   5. le reste, index, contraintes et triggers ;
#   6. 003 (schéma storage), contrôles.
#
# Le dump est pris en --no-acl : aucun GRANT n'est restauré. Le backend se
# connecte en tet_admin, propriétaire de tout ; Storage a les siens par 003 ;
# GoTrue reçoit USAGE sur les schémas applicatifs, pour ses triggers.
#
# Variables :
#   DUMP                     dump pg_dump --format=custom (data_layer/backup/backup.sh)
#   LIST_ONLY                (optionnel) true : affiche le tri du sommaire, n'écrit rien
#   RESTORE_ENCRYPTED_PASSWORD  hash bcrypt posé sur tous les comptes (requis)
#   EXCLUDE_REGEX            (optionnel) entrées du sommaire à écarter en plus (ERE)
#   JOBS                     (optionnel) parallélisme de pg_restore, défaut 4
#   CONFIRM                  (optionnel) « preprod » pour sauter la confirmation
set -euo pipefail

: "${DUMP:?DUMP non défini (chemin du .dump)}"

case "$-" in *x*)
  echo "✗ Refus de tourner en mode trace (set -x) : les mots de passe apparaîtraient." >&2
  exit 1
  ;;
esac

for bin in psql pg_restore terraform awk; do
  command -v "$bin" >/dev/null 2>&1 || {
    echo "✗ '$bin' requis mais introuvable." >&2
    exit 1
  }
done

_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
_nonprod="$_root/infra/nonprod"
_sql="$_nonprod/supabase-api/sql"
_backup_sql="$_root/data_layer/backup"
_jobs="${JOBS:-4}"

[ -s "$DUMP" ] || {
  echo "✗ Dump introuvable ou vide : $DUMP" >&2
  exit 1
}

if [ "${LIST_ONLY:-false}" != "true" ]; then
  _pwd="${RESTORE_ENCRYPTED_PASSWORD:-}"
  if [ "${#_pwd}" -ne 60 ] || ! [[ "$_pwd" =~ ^\$2[aby]\$ ]]; then
    echo "✗ RESTORE_ENCRYPTED_PASSWORD doit être un hash bcrypt (60 caractères, \$2a\$…)." >&2
    echo "  Des données de prod ne gardent pas leurs mots de passe en preprod." >&2
    echo "  Entre quotes simples : RESTORE_ENCRYPTED_PASSWORD='\$2a\$10\$…'" >&2
    exit 1
  fi
fi

umask 077
_work="$(mktemp -d)"
_log="${_work}/restore.log"
# Données brutes de prod en base entre la première restauration et la fin de
# l'anonymisation : une sortie dans cet intervalle doit se voir.
_raw=0
on_exit() {
  if [ "$_raw" -eq 1 ]; then
    echo "" >&2
    echo "⚠⚠ ARRÊT AVANT LA FIN DE L'ANONYMISATION : la preprod contient des données de prod" >&2
    echo "   brutes (téléphones, mots de passe, sessions). Relancer le script maintenant ; à défaut," >&2
    echo "   vider au moins auth : psql … -c 'DROP SCHEMA auth CASCADE'." >&2
  fi
  echo "Journal : $_log"
}
trap on_exit EXIT

# --- Connexion : endpoint public de la RDB preprod, en tet_admin ---
# Paramètres libpq par l'environnement, jamais d'URI : le mot de passe contient
# des caractères réservés, et ne passe pas par argv.
echo "→ Lecture des outputs de infra/nonprod…"
export PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD
PGHOST="$(terraform -chdir="$_nonprod" output -raw pg_endpoint_ip)"
PGPORT="$(terraform -chdir="$_nonprod" output -raw pg_endpoint_port)"
PGDATABASE="$(terraform -chdir="$_nonprod" output -raw pg_database_name)"
PGUSER="$(terraform -chdir="$_nonprod" output -raw pg_admin_user)"
PGPASSWORD="$(terraform -chdir="$_nonprod" output -raw pg_admin_password)"
export PGSSLMODE=require PGCONNECT_TIMEOUT=10 PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -X -w -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -Atc 'select 1' >/dev/null || {
  echo "✗ Connexion impossible à ${PGHOST}:${PGPORT} : IP du poste dans pg_allowed_ips ?" >&2
  exit 1
}

# --- Tri du sommaire du dump ---

# Schémas internes de Supabase Cloud : ni utiles hors de Supabase, ni
# restaurables par un admin non superuser. cron : les jobs pg_cron sont
# dépréciés, pas repris.
_skip_schemas="net vault pgsodium pgsodium_masks graphql graphql_public realtime _realtime supabase_functions supabase_migrations pgbouncer cron _analytics"
# Extensions écartées : pas disponibles, interdites à tet_admin (pg_cron,
# moddatetime), ou déjà là (plpgsql).
_deny_ext="pg_net http pg_jsonschema pg_graphql pgsodium supabase_vault pgjwt pg_cron moddatetime pg_stat_statements plpgsql"
_available_ext="$("${PSQL[@]}" -Atc 'select string_agg(name, $$ $$) from pg_available_extensions')"

pg_restore -l "$DUMP" >"$_work/full.toc"

awk -v skip="$_skip_schemas" -v deny="$_deny_ext" -v avail="$_available_ext" \
  -v extra="${EXCLUDE_REGEX:-}" -v work="$_work" '
  BEGIN {
    split(skip, a, " "); for (i in a) SKIP[a[i]] = 1
    split(deny, a, " "); for (i in a) DENY[a[i]] = 1
    split(avail, a, " "); for (i in a) AVAIL[a[i]] = 1
    # Types à plusieurs mots de pg_restore -l (le plus long l’emporte).
    n = split("TABLE DATA|SEQUENCE SET|SEQUENCE OWNED BY|FK CONSTRAINT|CHECK CONSTRAINT|MATERIALIZED VIEW|MATERIALIZED VIEW DATA|DEFAULT ACL|EVENT TRIGGER|FOREIGN TABLE|FOREIGN DATA WRAPPER|FOREIGN SERVER|LARGE OBJECT|ROW SECURITY|PUBLICATION TABLE|PUBLICATION TABLES IN SCHEMA|TEXT SEARCH CONFIGURATION|TEXT SEARCH DICTIONARY|TEXT SEARCH PARSER|TEXT SEARCH TEMPLATE|USER MAPPING|SHELL TYPE|PROCEDURAL LANGUAGE|OPERATOR CLASS|OPERATOR FAMILY|ACCESS METHOD|INDEX ATTACH|TABLE ATTACH", m, "|")
    for (i = 1; i <= n; i++) MW[i] = m[i]
  }
  function out(file, reason) {
    print > (work "/" file ".toc")
    if (reason != "") print reason "\t" $0 > (work "/excluded.tsv")
  }
  /^;/ { print > (work "/auth.toc"); print > (work "/main.toc"); next }
  /^[0-9]+; [0-9]+ [0-9]+ / {
    rest = $0; sub(/^[0-9]+; [0-9]+ [0-9]+ /, "", rest)
    type = ""
    for (i in MW) if (index(rest, MW[i] " ") == 1 && length(MW[i]) > length(type)) type = MW[i]
    if (type == "") { type = rest; sub(/ .*/, "", type) }
    rest = substr(rest, length(type) + 2)
    schema = rest; sub(/ .*/, "", schema)
    name = substr(rest, length(schema) + 2); sub(/ .*/, "", name)
    obj = substr(rest, length(schema) + 2)

    if (extra != "" && $0 ~ extra) { out("excluded", "EXCLUDE_REGEX"); next }
    if (schema in SKIP) { out("excluded", "schéma interne Supabase"); next }
    if (type == "SCHEMA" && (name in SKIP || name == "auth" || name == "public" || name == "extensions")) {
      out("excluded", "schéma posé par la préparation"); next
    }
    if (type == "COMMENT" && obj ~ /^(SCHEMA|EXTENSION) /) { out("excluded", "commentaire de schéma ou d’extension"); next }
    if (type == "EXTENSION" && (name in DENY || !(name in AVAIL))) { out("excluded", "extension indisponible"); next }
    if (type ~ /^(PUBLICATION|EVENT TRIGGER)/) { out("excluded", "publication / event trigger (superuser)"); next }
    # Fonctions internes de Supabase dans le schéma extensions (les membres
    # d’extension n’ont pas d’entrée propre).
    if (schema == "extensions") { out("excluded", "objet interne du schéma extensions"); next }
    if (schema == "auth") { out("auth", ""); next }
    out("main", "")
    next
  }
' "$_work/full.toc"
touch "$_work/excluded.tsv"

echo "→ Sommaire : $(grep -c '^[0-9]' "$_work/full.toc") entrées ; auth $(grep -c '^[0-9]' "$_work/auth.toc") ; reste $(grep -c '^[0-9]' "$_work/main.toc") ; écartées $(wc -l <"$_work/excluded.tsv" | tr -d ' ')"
cut -f1 "$_work/excluded.tsv" | sort | uniq -c | sed 's/^/    /'

if [ "${LIST_ONLY:-false}" = "true" ]; then
  echo ""
  echo "Entrées écartées (raison ⇥ entrée) :"
  sort "$_work/excluded.tsv" | sed 's/^/  /'
  echo ""
  echo "Hors schémas Supabase, à regarder de près (EXCLUDE_REGEX pour en écarter d'autres) :"
  grep -vE '^schéma interne Supabase' "$_work/excluded.tsv" | cut -f2 | sed 's/^/  /' || true
  echo ""
  echo "Triggers sur le schéma auth (créés en supabase_auth_admin, exécutés par GoTrue) :"
  grep -E '^[0-9]+; [0-9]+ [0-9]+ TRIGGER auth ' "$_work/auth.toc" | sed 's/^/  /' || true
  trap - EXIT
  rm -rf "$_work"
  exit 0
fi

# --- Garde-fous ---

# GoTrue et Storage arrêtés : ils réécriraient auth et storage pendant la restauration.
_busy="$("${PSQL[@]}" -Atc "select string_agg(distinct usename, ', ') from pg_stat_activity
  where datname = current_database() and usename in ('supabase_auth_admin', 'supabase_storage_admin')")"
if [ -n "$_busy" ]; then
  echo "✗ Connexions actives de ${_busy} : arrêter le service supabase-api dans Coolify." >&2
  exit 1
fi

# Une version de GoTrue plus ancienne que celle de Supabase Cloud ne sait pas
# lire le schéma auth du dump. Référence : migrations déjà appliquées par
# l'image déployée (avant que la préparation ne les efface).
_dump_auth="$(pg_restore --data-only -n auth -t schema_migrations -f - "$DUMP" 2>/dev/null \
  | awk '/^COPY /{c=1; next} /^\\\.$/{c=0} c' | sort | tail -n1)"
_image_auth="$("${PSQL[@]}" -Atc "select coalesce((select max(version) from auth.schema_migrations), '')" 2>/dev/null || true)"
echo "→ Migrations auth : dump ${_dump_auth:-?}, image GoTrue ${_image_auth:-? (schéma auth vide)}"
if [ -n "$_dump_auth" ] && [ -n "$_image_auth" ] && [[ "$_dump_auth" > "$_image_auth" ]]; then
  echo "✗ Le dump est plus récent que l'image GoTrue (${_dump_auth} > ${_image_auth}) :" >&2
  echo "  monter supabase/auth dans infra/nonprod/supabase-api/docker-compose.yml." >&2
  exit 1
fi

echo ""
echo "⚠ La base ${PGDATABASE} sur ${PGHOST}:${PGPORT} (preprod) va être remplacée par ${DUMP}."
if [ "${CONFIRM:-}" != "preprod" ]; then
  read -r -p "  Taper « preprod » pour continuer : " _answer
  [ "$_answer" = "preprod" ] || {
    echo "Abandon."
    exit 1
  }
fi

_errors=0
run_restore() { # run_restore <étape> <arguments pg_restore…>
  local _step="$1"
  shift
  echo "→ ${_step}…"
  # LC_ALL=C : messages en anglais, comptés ci-dessous.
  if ! LC_ALL=C pg_restore --no-owner --no-acl -d "$PGDATABASE" "$@" "$DUMP" >>"$_log" 2>&1; then
    local _n
    _n="$(grep -oE 'errors ignored on restore: [0-9]+' "$_log" | tail -n1 | grep -oE '[0-9]+$' || echo '?')"
    echo "  ⚠ ${_n} erreur(s), détail dans le journal"
    _errors=1
  fi
}

# --- 1. Préparation ---
echo "→ Préparation : schémas auth et extensions remis à zéro, bootstrap 001 / 002…"
"${PSQL[@]}" >>"$_log" 2>&1 <<'SQL'
DROP SCHEMA IF EXISTS auth CASCADE;
-- Recréé par le dump ; 003 y a ajouté des objets qui bloqueraient le --clean.
DROP SCHEMA IF EXISTS storage CASCADE;
DROP SCHEMA IF EXISTS extensions CASCADE;
CREATE SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO PUBLIC;
SQL
"${PSQL[@]}" -f "$_sql/001-bootstrap-auth-roles.sql" >>"$_log"
"${PSQL[@]}" -f "$_sql/002-bootstrap-supabase-roles.sql" >>"$_log"

# Sur Supabase, extensions est dans le search_path : les corps de fonctions y
# appellent unaccent() ou similarity() sans préfixe. Pas d'ALTER DATABASE
# (la base appartient à _rdb_superadmin) : au niveau des rôles.
for _role in "$PGUSER" anon authenticated service_role supabase_storage_admin; do
  "${PSQL[@]}" -c "ALTER ROLE \"${_role}\" SET search_path = \"\$user\", public, extensions" >>"$_log"
done

# --- 2. à 5. Restauration, anonymisation au plus tôt ---
# Chaque passe de données est anonymisée dès qu'elle est chargée, avant les
# index (la partie longue) : la fenêtre où la preprod porte des données brutes
# reste courte, et on_exit la signale si elle s'interrompt.
_raw=1
run_restore "auth : définitions et données" -L "$_work/auth.toc" --section=pre-data --section=data --role=supabase_auth_admin

# restore.sh ne copie qu'auth.users ; ici tout auth vient de la prod : sessions,
# jetons et secrets MFA n'ont rien à faire en preprod.
echo "→ Anonymisation d'auth…"
"${PSQL[@]}" -v pwd="$RESTORE_ENCRYPTED_PASSWORD" >>"$_log" <<'SQL'
UPDATE auth.users SET phone = NULL WHERE phone IS NOT NULL;
UPDATE auth.users SET encrypted_password = :'pwd' WHERE encrypted_password IS DISTINCT FROM :'pwd';
-- Jetons en cours (un lien de récupération de prod marcherait en preprod) et
-- téléphone en attente de changement. '' plutôt que NULL : GoTrue ne sait pas
-- lire ces colonnes à NULL.
UPDATE auth.users SET confirmation_token = '', recovery_token = '',
  email_change_token_new = '', email_change_token_current = '',
  phone_change_token = '', reauthentication_token = '', phone_change = '';
UPDATE auth.identities SET identity_data = identity_data - 'phone' WHERE identity_data ? 'phone';
DO $$
DECLARE t text;
BEGIN
  -- Sessions, jetons, secrets MFA / WebAuthn / OAuth, et journal des
  -- connexions (adresses IP).
  FOREACH t IN ARRAY ARRAY['auth.refresh_tokens', 'auth.sessions', 'auth.mfa_amr_claims',
    'auth.mfa_challenges', 'auth.mfa_factors', 'auth.one_time_tokens', 'auth.flow_state',
    'auth.audit_log_entries', 'auth.webauthn_credentials', 'auth.webauthn_challenges',
    'auth.oauth_authorizations', 'auth.oauth_consents', 'auth.saml_relay_states'] LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('TRUNCATE %s CASCADE', t);
    END IF;
  END LOOP;
END $$;
SQL

run_restore "reste : définitions et données (${_jobs} jobs)" -L "$_work/main.toc" --section=pre-data --section=data --clean --if-exists -j "$_jobs"

# Reprend auth.users (idempotent) et ajoute dcp, config, puis ses assertions.
echo "→ Anonymisation (clean_data.sql)…"
"${PSQL[@]}" -v pwd="$RESTORE_ENCRYPTED_PASSWORD" -f "$_backup_sql/clean_data.sql" >>"$_log"
_raw=0

# Les triggers d'auth.users (créés en supabase_auth_admin) désignent des
# fonctions de schémas applicatifs : il faut pouvoir les nommer.
"${PSQL[@]}" >>"$_log" <<'SQL'
DO $$
DECLARE s text;
BEGIN
  FOR s IN SELECT nspname FROM pg_namespace
    WHERE nspname NOT IN ('auth', 'extensions', 'information_schema') AND nspname !~ '^pg_'
  LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO supabase_auth_admin', s);
  END LOOP;
END $$;
SQL

run_restore "auth : index, contraintes, triggers" -L "$_work/auth.toc" --section=post-data --role=supabase_auth_admin
run_restore "reste : index, contraintes, triggers (${_jobs} jobs)" -L "$_work/main.toc" --section=post-data -j "$_jobs"

# --- 6. Storage, contrôles ---
echo "→ Schéma storage (003)…"
"${PSQL[@]}" -f "$_sql/003-bootstrap-storage.sql" >>"$_log"

echo "→ Contrôles…"
_fail=0
for _t in auth.users public.collectivite public.dcp public.indicateur_valeur public.action_statut public.score_snapshot storage.objects; do
  _c="$("${PSQL[@]}" -Atc "select count(*) from ${_t}" 2>/dev/null || echo '')"
  if [ -z "$_c" ] || [ "$_c" -eq 0 ]; then
    echo "  ✗ ${_t} : ${_c:-absente}"
    _fail=1
  else
    echo "  ✓ ${_t} : ${_c}"
  fi
done

if [ "$_errors" -ne 0 ] || [ "$_fail" -ne 0 ]; then
  echo "✗ Restauration terminée avec des erreurs : relire le journal (grep -n 'error:' $_log)."
  exit 1
fi
echo "✓ Preprod restaurée depuis ${DUMP}. Démarrer supabase-api, puis redéployer le backend."
