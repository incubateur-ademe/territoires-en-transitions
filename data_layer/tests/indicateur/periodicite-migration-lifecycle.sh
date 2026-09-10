#!/usr/bin/env bash

set -euo pipefail

database_url="${PERIODICITE_MIGRATION_TEST_DATABASE_URL:-}"
if [[ -z "$database_url" ]]; then
  echo "PERIODICITE_MIGRATION_TEST_DATABASE_URL doit cibler une base jetable déjà initialisée, avant la migration." >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_dir/../../.." && pwd)"
database_manager="$script_dir/periodicite-migration-lifecycle-database.sh"

psql_test() {
  psql --quiet --no-psqlrc --set=ON_ERROR_STOP=1 --dbname="$database_url" "$@"
}

scalar() {
  psql_test --tuples-only --no-align --command="$1"
}

assert_equal() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "ÉCHEC: $message (attendu: $expected, obtenu: $actual)" >&2
    exit 1
  fi
}

apply_change() {
  psql_test --file="$repository_root/$1" >/dev/null
}

expect_change_failure() {
  local change="$1"
  local message="$2"
  if psql_test --file="$repository_root/$change" >/dev/null 2>&1; then
    echo "ÉCHEC: $message" >&2
    exit 1
  fi
}

wait_for_sleeping_session() {
  local application_name="$1"
  local attempt
  for attempt in {1..50}; do
    if [[ "$(scalar "SELECT count(*) FROM pg_stat_activity WHERE application_name = '$application_name' AND wait_event = 'PgSleep'")" == "1" ]]; then
      return
    fi
    sleep 0.1
  done
  echo "ÉCHEC: la session concurrente $application_name n'a pas atteint son point de synchronisation" >&2
  exit 1
}

wait_for_advisory_lock_session() {
  local application_name="$1"
  local attempt
  for attempt in {1..50}; do
    if [[ "$(scalar "SELECT count(*) FROM pg_locks verrou JOIN pg_stat_activity session ON session.pid = verrou.pid WHERE session.application_name = '$application_name' AND verrou.locktype = 'advisory' AND NOT verrou.granted")" == "1" ]]; then
      return
    fi
    sleep 0.1
  done
  echo "ÉCHEC: la session concurrente $application_name n'attend pas le verrou du graphe" >&2
  exit 1
}

wait_for_relation_lock_session() {
  local application_name="$1"
  local attempt
  for attempt in {1..50}; do
    if [[ "$(scalar "SELECT count(*) FROM pg_locks verrou JOIN pg_stat_activity session ON session.pid = verrou.pid WHERE session.application_name = '$application_name' AND verrou.locktype = 'relation' AND NOT verrou.granted")" != "0" ]]; then
      return
    fi
    sleep 0.1
  done
  echo "ÉCHEC: la session concurrente $application_name n'attend pas un verrou de table" >&2
  exit 1
}

database_name="$(scalar 'SELECT current_database()')"
PERIODICITE_MIGRATION_ADMIN_DATABASE_URL="$database_url" \
  PERIODICITE_MIGRATION_DATABASE_NAME="$database_name" \
  bash "$database_manager" assert-disposable-url

assert_equal "" "$(scalar "SELECT to_regclass('public.indicateur_periodicite')")" \
  "la base doit être positionnée avant l'étape expand"
assert_equal "0" "$(scalar "SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicateur_definition' AND column_name = 'periodicite'")" \
  "la colonne de périodicité ne doit pas encore exister"

fixture_suffix="${BASHPID}-$(date +%s%N)"
collectivite_id="$(scalar "INSERT INTO public.collectivite (nom, type) VALUES ('Cycle périodicité $fixture_suffix', 'epci') RETURNING id")"
origin_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite) VALUES ($collectivite_id, 'cycle-origin-$fixture_suffix', 'kWh') RETURNING id")"
target_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite) VALUES ($collectivite_id, 'cycle-target-$fixture_suffix', 'kWh') RETURNING id")"
concurrency_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite) VALUES ($collectivite_id, 'cycle-concurrence-$fixture_suffix', 'kWh') RETURNING id")"
conflict_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite) VALUES ($collectivite_id, 'cycle-conflit-$fixture_suffix', 'kWh') RETURNING id")"
emt_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite) VALUES ('cycle-emt-$fixture_suffix', 'cycle-emt-$fixture_suffix', 'kWh') RETURNING id")"
emt_second_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite) VALUES ('cycle-emt-second-$fixture_suffix', 'cycle-emt-second-$fixture_suffix', 'kWh') RETURNING id")"
expand_delete_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite) VALUES ($collectivite_id, 'cycle-expand-delete-$fixture_suffix', 'kWh') RETURNING id")"

origin_value_id="$(scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($origin_id, $collectivite_id, DATE '2020-02-01', 1) RETURNING id")"
scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($conflict_id, $collectivite_id, DATE '2019-02-01', 1), ($conflict_id, $collectivite_id, DATE '2019-03-01', 2)" >/dev/null
scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($expand_delete_id, $collectivite_id, DATE '2020-01-01', 1)" >/dev/null

expand_migration_log="$(mktemp)"
expand_delete_log="$(mktemp)"
transition_log="$(mktemp)"
graph_definition_log="$(mktemp)"
graph_value_log="$(mktemp)"
emt_definition_log="$(mktemp)"
emt_writer_log="$(mktemp)"
emt_lock_first_log="$(mktemp)"
emt_lock_second_log="$(mktemp)"
reconciliation_producer_log="$(mktemp)"
reconciliation_revert_log="$(mktemp)"
reconciliation_reader_log="$(mktemp)"
trap 'rm -f "$expand_migration_log" "$expand_delete_log" "$transition_log" "$graph_definition_log" "$graph_value_log" "$emt_definition_log" "$emt_writer_log" "$emt_lock_first_log" "$emt_lock_second_log" "$reconciliation_producer_log" "$reconciliation_revert_log" "$reconciliation_reader_log"' EXIT

# L'expand prend définition puis valeur. Une ancienne suppression avec cascade
# arrivée ensuite attend donc sans détenir la table de valeurs : la migration
# peut progresser, puis la suppression se termine sans interblocage.
psql_test --command="SET application_name = 'periodicite-lifecycle-expand-migration'; BEGIN; LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE; SELECT pg_sleep(3); LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE; COMMIT" >"$expand_migration_log" 2>&1 &
expand_migration_pid=$!
wait_for_sleeping_session periodicite-lifecycle-expand-migration
psql_test --command="SET application_name = 'periodicite-lifecycle-expand-delete'; DELETE FROM public.indicateur_definition WHERE id = $expand_delete_id" >"$expand_delete_log" 2>&1 &
expand_delete_pid=$!
wait_for_relation_lock_session periodicite-lifecycle-expand-delete
wait "$expand_migration_pid"
wait "$expand_delete_pid"
assert_equal "0" "$(scalar "SELECT count(*) FROM public.indicateur_definition WHERE id = $expand_delete_id")" \
  "l'ordre définition puis valeur de l'expand doit laisser finir une ancienne suppression en cascade"

apply_change data_layer/sqitch/deploy/indicateur/periodicite.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite.sql
apply_change data_layer/sqitch/deploy/indicateur/import_emt_valeur.sql
apply_change data_layer/sqitch/verify/indicateur/import_emt_valeur.sql
apply_change data_layer/sqitch/deploy/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/verify/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/deploy/indicateur/dependances_formules.sql
apply_change data_layer/sqitch/verify/indicateur/dependances_formules.sql
assert_equal "2020-01-01|2020-02-01|normalisee" \
  "$(scalar "SELECT valeur.date_valeur || '|' || audit.date_valeur_avant || '|' || audit.statut FROM public.indicateur_valeur valeur JOIN migration.indicateur_valeur_periodicite_audit audit ON audit.valeur_id = valeur.id WHERE valeur.id = $origin_value_id")" \
  "l'expand doit normaliser et auditer une date historique sans collision"
assert_equal "2" "$(scalar "SELECT count(*) FROM migration.indicateur_valeur_periodicite_audit WHERE indicateur_id = $conflict_id AND statut = 'conflit'")" \
  "l'expand doit auditer sans fusionner les collisions historiques"

scalar "DELETE FROM public.indicateur_valeur WHERE indicateur_id = $conflict_id AND date_valeur = DATE '2019-03-01'; UPDATE public.indicateur_valeur SET date_valeur = DATE '2019-01-01' WHERE indicateur_id = $conflict_id" >/dev/null
assert_equal "0" "$(scalar "SELECT count(*) FROM migration.indicateur_valeur_periodicite_audit WHERE indicateur_id = $conflict_id")" \
  "la remédiation explicite doit assainir les audits de conflit"

# Simule indicateur_valeur restaurée sans triggers durant la phase expand. Le
# post-traitement doit rejouer l'audit transitoire et conserver son historique.
scalar "ALTER TABLE public.indicateur_valeur DISABLE TRIGGER USER" >/dev/null
expand_restore_value_id="$(scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($target_id, $collectivite_id, DATE '2025-02-01', 7) RETURNING id")"
scalar "ALTER TABLE public.indicateur_valeur ENABLE TRIGGER USER" >/dev/null
apply_change data_layer/backup/rebuild-indicateur-formula-state.sql
assert_equal "2025-01-01|2025-02-01|normalisee" \
  "$(scalar "SELECT valeur.date_valeur || '|' || audit.date_valeur_avant || '|' || audit.statut FROM public.indicateur_valeur valeur JOIN migration.indicateur_valeur_periodicite_audit audit ON audit.valeur_id = valeur.id WHERE valeur.id = $expand_restore_value_id")" \
  "le post-traitement expand doit normaliser et auditer une valeur restaurée sans triggers"

psql_test --command="SET application_name = 'periodicite-lifecycle-transition-writer'; BEGIN; INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($concurrency_id, $collectivite_id, DATE '2021-02-01', 1); SELECT pg_sleep(3); COMMIT" >"$transition_log" 2>&1 &
transition_pid=$!
wait_for_sleeping_session periodicite-lifecycle-transition-writer
if psql_test --command="INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($concurrency_id, $collectivite_id, DATE '2021-03-01', 2)" >/dev/null 2>&1; then
  echo "ÉCHEC: deux écritures historiques concurrentes ont occupé la même période canonique" >&2
  exit 1
fi
wait "$transition_pid"
assert_equal "1|2021-01-01" \
  "$(scalar "SELECT count(*) || '|' || min(date_valeur) FROM public.indicateur_valeur WHERE indicateur_id = $concurrency_id AND resultat IN (1, 2)")" \
  "les écritures de transition doivent se sérialiser sur la période canonique"

# L'import EMT est déployable dès l'expand et participe au même ordre de
# verrous que l'application. Si le changement de cadence gagne, l'import
# attend puis refuse la définition devenue mensuelle sans écrire de valeur.
psql_test --command="SET application_name = 'periodicite-lifecycle-emt-definition'; BEGIN; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $emt_id; SELECT pg_sleep(3); COMMIT" >"$emt_definition_log" 2>&1 &
emt_definition_pid=$!
wait_for_sleeping_session periodicite-lifecycle-emt-definition
psql_test --command="SET application_name = 'periodicite-lifecycle-emt-writer'; SELECT public.import_indicateur_emt_valeurs($collectivite_id, jsonb_build_array(jsonb_build_object('indicateur_id', $emt_id, 'periodicite', 'annuelle', 'date_debut', '2030-01-01', 'resultat', 0, 'commentaire', 'cycle EMT')))" >"$emt_writer_log" 2>&1 &
emt_writer_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-emt-writer
wait "$emt_definition_pid"
if wait "$emt_writer_pid"; then
  echo "ÉCHEC: l'import EMT a écrit après un changement concurrent vers mensuelle" >&2
  exit 1
fi
assert_equal "mensuelle|0" \
  "$(scalar "SELECT definition.periodicite || '|' || count(valeur.*) FROM public.indicateur_definition definition LEFT JOIN public.indicateur_valeur valeur ON valeur.indicateur_id = definition.id WHERE definition.id = $emt_id GROUP BY definition.periodicite")" \
  "le changement de cadence validé en premier doit faire échouer l'import EMT"
scalar "UPDATE public.indicateur_definition SET periodicite = 'annuelle' WHERE id = $emt_id" >/dev/null

# Si le writer annuel gagne, il conserve son verrou partagé jusqu'au commit.
# La mutation attend, puis le garde d'immuabilité voit la valeur et échoue.
psql_test --command="SET application_name = 'periodicite-lifecycle-emt-writer'; BEGIN; SELECT pg_advisory_xact_lock_shared(hashtextextended('indicateur-calculation-graph', 0)); SELECT id FROM public.indicateur_definition WHERE id = $emt_id FOR SHARE; SELECT pg_sleep(3); SELECT public.import_indicateur_emt_valeurs($collectivite_id, jsonb_build_array(jsonb_build_object('indicateur_id', $emt_id, 'periodicite', 'annuelle', 'date_debut', '2030-01-01', 'resultat', 0, 'commentaire', 'cycle EMT'))); COMMIT" >"$emt_writer_log" 2>&1 &
emt_writer_pid=$!
wait_for_sleeping_session periodicite-lifecycle-emt-writer
psql_test --command="SET application_name = 'periodicite-lifecycle-emt-definition'; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $emt_id" >"$emt_definition_log" 2>&1 &
emt_definition_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-emt-definition
wait "$emt_writer_pid"
if wait "$emt_definition_pid"; then
  echo "ÉCHEC: un changement concurrent a invalidé la cadence d'une valeur EMT validée" >&2
  exit 1
fi
assert_equal "annuelle|1|0" \
  "$(scalar "SELECT definition.periodicite || '|' || count(valeur.*) || '|' || min(valeur.resultat) FROM public.indicateur_definition definition LEFT JOIN public.indicateur_valeur valeur ON valeur.indicateur_id = definition.id WHERE definition.id = $emt_id GROUP BY definition.periodicite")" \
  "l'import EMT validé en premier doit conserver la cadence, la ligne et la valeur zéro"

# Les verrous de valeur sont indexés par collectivité et date, pas par
# indicateur. Une session retient volontairement 2035 pendant que l'autre lot
# présente les mêmes dates dans l'ordre inverse de ses indicateurs. Avec une
# pré-acquisition lexicographique, la seconde session n'emporte aucun verrou
# ultérieur et les deux lots finissent sans interblocage.
psql_test --command="SET application_name = 'periodicite-lifecycle-emt-lock-first'; BEGIN; SELECT pg_advisory_xact_lock(hashtextextended('indicateur-valeur:$collectivite_id:2035-01-01', 0)); SELECT pg_sleep(3); SELECT public.import_indicateur_emt_valeurs($collectivite_id, jsonb_build_array(jsonb_build_object('indicateur_id', $emt_id, 'periodicite', 'annuelle', 'date_debut', '2035-01-01', 'resultat', 1), jsonb_build_object('indicateur_id', $emt_second_id, 'periodicite', 'annuelle', 'date_debut', '2036-01-01', 'resultat', 2))); COMMIT" >"$emt_lock_first_log" 2>&1 &
emt_lock_first_pid=$!
wait_for_sleeping_session periodicite-lifecycle-emt-lock-first
psql_test --command="SET application_name = 'periodicite-lifecycle-emt-lock-second'; SELECT public.import_indicateur_emt_valeurs($collectivite_id, jsonb_build_array(jsonb_build_object('indicateur_id', $emt_id, 'periodicite', 'annuelle', 'date_debut', '2036-01-01', 'resultat', 3), jsonb_build_object('indicateur_id', $emt_second_id, 'periodicite', 'annuelle', 'date_debut', '2035-01-01', 'resultat', 4)))" >"$emt_lock_second_log" 2>&1 &
emt_lock_second_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-emt-lock-second
if ! wait "$emt_lock_first_pid"; then
  cat "$emt_lock_first_log" >&2
  echo "ÉCHEC: le premier lot EMT a échoué pendant la sérialisation multi-périodes" >&2
  exit 1
fi
if ! wait "$emt_lock_second_pid"; then
  cat "$emt_lock_second_log" >&2
  echo "ÉCHEC: le second lot EMT a rencontré un interblocage multi-périodes" >&2
  exit 1
fi
assert_equal "4" \
  "$(scalar "SELECT count(*) FROM public.indicateur_valeur WHERE collectivite_id = $collectivite_id AND indicateur_id IN ($emt_id, $emt_second_id) AND date_valeur IN (DATE '2035-01-01', DATE '2036-01-01')")" \
  "les lots EMT aux périodes croisées doivent tous deux être écrits"

# Si un producteur de réconciliation valide son intention en premier, le
# revert attend le verrou exclusif du graphe puis refuse de supprimer une file
# non vide. Le contrôle de vacuité porte donc bien sur l'état commité.
psql_test --command="SET application_name = 'periodicite-lifecycle-reconciliation-producer'; BEGIN; SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0)); INSERT INTO private.indicateur_reconciliation_formule (generation, indicateur_id, collectivite_id, formule_attendue) VALUES (gen_random_uuid(), $target_id, $collectivite_id, '1'); SELECT pg_sleep(3); COMMIT" >"$reconciliation_producer_log" 2>&1 &
reconciliation_producer_pid=$!
wait_for_sleeping_session periodicite-lifecycle-reconciliation-producer
psql_test \
  --command="SET application_name = 'periodicite-lifecycle-reconciliation-revert'" \
  --file="$repository_root/data_layer/sqitch/revert/indicateur/reconciliation_formules.sql" \
  >"$reconciliation_revert_log" 2>&1 &
reconciliation_revert_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-reconciliation-revert
wait "$reconciliation_producer_pid"
if wait "$reconciliation_revert_pid"; then
  echo "ÉCHEC: le revert a supprimé une file contenant une réconciliation validée" >&2
  exit 1
fi
assert_equal "1" \
  "$(scalar "SELECT count(*) FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $target_id AND collectivite_id = $collectivite_id")" \
  "le revert doit conserver la file et l'intention validée par le producteur"
scalar "DELETE FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $target_id AND collectivite_id = $collectivite_id" >/dev/null

# Dans l'ordre inverse, un lecteur maintient provisoirement le revert entre le
# verrou du graphe et son verrou ACCESS EXCLUSIVE. Un producteur arrivé ensuite
# attend le graphe : il ne peut pas franchir le contrôle de vacuité avant le
# DROP et échoue lorsque la relation a disparu.
psql_test --command="SET application_name = 'periodicite-lifecycle-reconciliation-reader'; BEGIN; SELECT count(*) FROM private.indicateur_reconciliation_formule; SELECT pg_sleep(3); COMMIT" >"$reconciliation_reader_log" 2>&1 &
reconciliation_reader_pid=$!
wait_for_sleeping_session periodicite-lifecycle-reconciliation-reader
psql_test \
  --command="SET application_name = 'periodicite-lifecycle-reconciliation-revert'" \
  --file="$repository_root/data_layer/sqitch/revert/indicateur/reconciliation_formules.sql" \
  >"$reconciliation_revert_log" 2>&1 &
reconciliation_revert_pid=$!
wait_for_relation_lock_session periodicite-lifecycle-reconciliation-revert
psql_test --command="SET application_name = 'periodicite-lifecycle-reconciliation-producer'; BEGIN; SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0)); INSERT INTO private.indicateur_reconciliation_formule (generation, indicateur_id, collectivite_id, formule_attendue) VALUES (gen_random_uuid(), $target_id, $collectivite_id, '2'); COMMIT" >"$reconciliation_producer_log" 2>&1 &
reconciliation_producer_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-reconciliation-producer
wait "$reconciliation_reader_pid"
if ! wait "$reconciliation_revert_pid"; then
  cat "$reconciliation_revert_log" >&2
  echo "ÉCHEC: le revert n'a pas supprimé la file vide après avoir gagné la course" >&2
  exit 1
fi
if wait "$reconciliation_producer_pid"; then
  echo "ÉCHEC: un producteur a écrit dans la file après le contrôle de vacuité du revert" >&2
  exit 1
fi
assert_equal "" \
  "$(scalar "SELECT to_regclass('private.indicateur_reconciliation_formule')")" \
  "le revert arrivé en premier doit supprimer entièrement la file"

# Le changement doit rester rejouable après le scénario de rollback concurrent.
apply_change data_layer/sqitch/deploy/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/verify/indicateur/reconciliation_formules.sql

# Les triggers statement-level étendent le verrou du graphe aux écritures SQL
# directes. Ils n'offrent toutefois ni le verrou applicatif par période, ni le
# recalcul des dépendances. Ce test ne couvre que les deux ordres d'arrivée du
# graphe et l'absence d'interblocage.
psql_test --command="SET application_name = 'periodicite-lifecycle-graph-definition'; BEGIN; UPDATE public.indicateur_definition SET valeur_calcule = '1' WHERE id = $target_id; SELECT pg_sleep(3); COMMIT" >"$graph_definition_log" 2>&1 &
graph_definition_pid=$!
wait_for_sleeping_session periodicite-lifecycle-graph-definition
psql_test --command="SET application_name = 'periodicite-lifecycle-graph-value'; INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($concurrency_id, $collectivite_id, DATE '2023-01-01', 4)" >"$graph_value_log" 2>&1 &
graph_value_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-graph-value
wait "$graph_definition_pid"
wait "$graph_value_pid"
assert_equal "1|1" \
  "$(scalar "SELECT (SELECT count(*) FROM public.indicateur_valeur WHERE indicateur_id = $concurrency_id AND date_valeur = DATE '2023-01-01') || '|' || (SELECT valeur_calcule FROM public.indicateur_definition WHERE id = $target_id)")" \
  "une mutation du graphe arrivée en premier doit précéder l'écriture de valeur"

psql_test --command="SET application_name = 'periodicite-lifecycle-graph-value'; BEGIN; INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($concurrency_id, $collectivite_id, DATE '2024-01-01', 5); SELECT pg_sleep(3); COMMIT" >"$graph_value_log" 2>&1 &
graph_value_pid=$!
wait_for_sleeping_session periodicite-lifecycle-graph-value
psql_test --command="SET application_name = 'periodicite-lifecycle-graph-definition'; UPDATE public.indicateur_definition SET valeur_calcule = '2' WHERE id = $target_id" >"$graph_definition_log" 2>&1 &
graph_definition_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-graph-definition
wait "$graph_value_pid"
wait "$graph_definition_pid"
assert_equal "1|2" \
  "$(scalar "SELECT (SELECT count(*) FROM public.indicateur_valeur WHERE indicateur_id = $concurrency_id AND date_valeur = DATE '2024-01-01') || '|' || (SELECT valeur_calcule FROM public.indicateur_definition WHERE id = $target_id)")" \
  "une écriture de valeur arrivée en premier doit précéder la mutation du graphe"

apply_change data_layer/sqitch/revert/indicateur/dependances_formules.sql
apply_change data_layer/sqitch/revert/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/revert/indicateur/import_emt_valeur.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite.sql
assert_equal "0" \
  "$(scalar "SELECT position('iri.periodicite' IN pg_get_functiondef('public.indicateurs_gaz_effet_serre(site_labellisation)'::regprocedure))")" \
  "le revert doit restaurer la projection GES sans dépendance à la colonne supprimée"
assert_equal "2020-02-01" "$(scalar "SELECT date_valeur FROM public.indicateur_valeur WHERE id = $origin_value_id")" \
  "le revert restaure la date historique auditée"
assert_equal "1" "$(scalar "SELECT count(*) FROM public.indicateur_valeur WHERE indicateur_id = $concurrency_id AND date_valeur = DATE '2021-02-01'")" \
  "le revert doit restaurer une date dont l'audit est toujours valide"
assert_equal "" "$(scalar "SELECT to_regclass('public.indicateur_periodicite')")" \
  "le revert complet doit retirer le catalogue"
assert_equal "" "$(scalar "SELECT to_regclass('private.indicateur_reconciliation_formule')")" \
  "le revert complet doit retirer la file de réconciliation"
assert_equal "" "$(scalar "SELECT to_regprocedure('private.extraire_dependances_formule_indicateur(text)')")" \
  "le revert complet doit retirer l'extracteur de dépendances"

echo "Cycle Sqitch de périodicité validé sur la base jetable '$database_name'."
