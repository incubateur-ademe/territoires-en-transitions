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

apply_contract_change() {
  psql_test \
    --command="SET tet.periodicite_contract_confirmed = 'on'" \
    --file="$repository_root/$1" >/dev/null
}

expect_change_failure() {
  local change="$1"
  local message="$2"
  if psql_test --file="$repository_root/$change" >/dev/null 2>&1; then
    echo "ÉCHEC: $message" >&2
    exit 1
  fi
}

expect_contract_change_failure() {
  local change="$1"
  local message="$2"
  if psql_test \
    --command="SET tet.periodicite_contract_confirmed = 'on'" \
    --file="$repository_root/$change" >/dev/null 2>&1; then
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
contract_writer_log="$(mktemp)"
graph_definition_log="$(mktemp)"
graph_value_log="$(mktemp)"
formula_source_log="$(mktemp)"
formula_target_log="$(mktemp)"
emt_definition_log="$(mktemp)"
emt_writer_log="$(mktemp)"
emt_lock_first_log="$(mktemp)"
emt_lock_second_log="$(mktemp)"
reconciliation_producer_log="$(mktemp)"
reconciliation_revert_log="$(mktemp)"
reconciliation_reader_log="$(mktemp)"
trap 'rm -f "$expand_migration_log" "$expand_delete_log" "$transition_log" "$contract_writer_log" "$graph_definition_log" "$graph_value_log" "$formula_source_log" "$formula_target_log" "$emt_definition_log" "$emt_writer_log" "$emt_lock_first_log" "$emt_lock_second_log" "$reconciliation_producer_log" "$reconciliation_revert_log" "$reconciliation_reader_log"' EXIT

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

expect_change_failure data_layer/scripts/check-periodicite-contract.sql \
  "le preflight doit refuser un audit contenant encore des conflits"
expect_contract_change_failure data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql \
  "le contract doit refuser un audit contenant encore des conflits"
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

scalar "UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-source-inconnue-$fixture_suffix)' WHERE id = $target_id" >/dev/null
expect_change_failure data_layer/scripts/check-periodicite-contract.sql \
  "le preflight doit refuser une formule qui référence une définition inconnue"
scalar "UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-emt-$fixture_suffix)' WHERE id = $target_id; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $emt_id" >/dev/null
expect_change_failure data_layer/scripts/check-periodicite-contract.sql \
  "le preflight doit refuser une formule dont la source a une autre périodicité"
scalar "UPDATE public.indicateur_definition SET valeur_calcule = NULL WHERE id = $target_id; UPDATE public.indicateur_definition SET periodicite = 'annuelle' WHERE id = $emt_id" >/dev/null
apply_change data_layer/scripts/check-periodicite-contract.sql
expect_change_failure data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql \
  "le contract doit refuser un déploiement sans confirmation explicite"

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

# Reproduit un writer canonique ayant pris le verrou partagé du graphe puis sa
# définition avant que le contract ne demande le verrou exclusif. Le contract
# attend sans tenir de table ; le writer peut terminer puis le débloquer.
psql_test --command="SET application_name = 'periodicite-lifecycle-contract-writer'; BEGIN; SELECT pg_advisory_xact_lock_shared(hashtextextended('indicateur-calculation-graph', 0)); SELECT id FROM public.indicateur_definition WHERE id = $concurrency_id FOR SHARE; SELECT pg_sleep(3); INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES ($concurrency_id, $collectivite_id, DATE '2022-01-01', 3); COMMIT" >"$contract_writer_log" 2>&1 &
contract_writer_pid=$!
wait_for_sleeping_session periodicite-lifecycle-contract-writer
timeout 20 psql --quiet --no-psqlrc --set=ON_ERROR_STOP=1 \
  --dbname="$database_url" \
  --command="SET tet.periodicite_contract_confirmed = 'on'" \
  --file="$repository_root/data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql" >/dev/null
wait "$contract_writer_pid"
apply_change data_layer/sqitch/verify/indicateur/periodicite_obligatoire.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_formules.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_formules.sql

formula_source_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite, periodicite) VALUES ('cycle-formula-source-$fixture_suffix', 'cycle-formula-source-$fixture_suffix', 'kWh', 'annuelle') RETURNING id")"
formula_target_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite, periodicite) VALUES ('cycle-formula-target-$fixture_suffix', 'cycle-formula-target-$fixture_suffix', 'kWh', 'annuelle') RETURNING id")"

# Dans les deux ordres d'arrivée, le verrou exclusif du graphe force le second
# writer à valider contre le commit du premier. La contrainte différable voit
# alors soit la nouvelle arête, soit la nouvelle cadence, et échoue fermé.
psql_test --command="SET application_name = 'periodicite-lifecycle-formula-target'; BEGIN; UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id; SELECT pg_sleep(3); COMMIT" >"$formula_target_log" 2>&1 &
formula_target_pid=$!
wait_for_sleeping_session periodicite-lifecycle-formula-target
psql_test --command="SET application_name = 'periodicite-lifecycle-formula-source'; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $formula_source_id" >"$formula_source_log" 2>&1 &
formula_source_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-formula-source
wait "$formula_target_pid"
if wait "$formula_source_pid"; then
  echo "ÉCHEC: une modification concurrente a désaligné la source d'une formule validée" >&2
  exit 1
fi
assert_equal "annuelle|1" \
  "$(scalar "SELECT source.periodicite || '|' || count(dependance.*) FROM public.indicateur_definition source LEFT JOIN private.indicateur_definition_dependance_calcul dependance ON dependance.source_identifiant = source.identifiant_referentiel WHERE source.id = $formula_source_id GROUP BY source.periodicite")" \
  "la formule validée en premier doit empêcher la source de changer de cadence"

scalar "UPDATE public.indicateur_definition SET valeur_calcule = NULL WHERE id = $formula_target_id" >/dev/null
psql_test --command="SET application_name = 'periodicite-lifecycle-formula-source'; BEGIN; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $formula_source_id; SELECT pg_sleep(3); COMMIT" >"$formula_source_log" 2>&1 &
formula_source_pid=$!
wait_for_sleeping_session periodicite-lifecycle-formula-source
psql_test --command="SET application_name = 'periodicite-lifecycle-formula-target'; UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id" >"$formula_target_log" 2>&1 &
formula_target_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-formula-target
wait "$formula_source_pid"
if wait "$formula_target_pid"; then
  echo "ÉCHEC: une formule concurrente a accepté une source devenue mensuelle" >&2
  exit 1
fi
assert_equal "mensuelle|0" \
  "$(scalar "SELECT source.periodicite || '|' || count(dependance.*) FROM public.indicateur_definition source LEFT JOIN private.indicateur_definition_dependance_calcul dependance ON dependance.source_identifiant = source.identifiant_referentiel WHERE source.id = $formula_source_id GROUP BY source.periodicite")" \
  "la cadence validée en premier doit faire échouer la nouvelle formule sans laisser de projection"
scalar "UPDATE public.indicateur_definition SET periodicite = 'annuelle' WHERE id = $formula_source_id" >/dev/null

apply_change data_layer/sqitch/deploy/stats/report_indicateur_resultat_periode.sql
apply_change data_layer/sqitch/verify/stats/report_indicateur_resultat_periode.sql

# Une restauration charge indicateur_definition avec les triggers USER coupés.
# Simule cet état, puis vérifie que le post-traitement reconstruit la projection,
# valide le graphe atomiquement et préserve les réconciliations encore dues.
scalar "UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id" >/dev/null
scalar "INSERT INTO private.indicateur_reconciliation_formule (generation, indicateur_id, collectivite_id, formule_attendue) VALUES (gen_random_uuid(), $formula_target_id, $collectivite_id, 'val(cycle-formula-source-$fixture_suffix)')" >/dev/null
scalar "ALTER TABLE public.indicateur_definition DISABLE TRIGGER USER; DELETE FROM private.indicateur_definition_dependance_calcul WHERE indicateur_id = $formula_target_id; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $formula_source_id; ALTER TABLE public.indicateur_definition ENABLE TRIGGER USER" >/dev/null
expect_change_failure data_layer/backup/rebuild-indicateur-formula-state.sql \
  "le rebuild post-restore doit refuser atomiquement un graphe inter-périodicité"
assert_equal "0|1" \
  "$(scalar "SELECT (SELECT count(*) FROM private.indicateur_definition_dependance_calcul WHERE indicateur_id = $formula_target_id) || '|' || (SELECT count(*) FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $formula_target_id)")" \
  "un rebuild invalide ne doit ni publier une projection ni vider la file"
scalar "ALTER TABLE public.indicateur_definition DISABLE TRIGGER USER; UPDATE public.indicateur_definition SET periodicite = 'annuelle' WHERE id = $formula_source_id; ALTER TABLE public.indicateur_definition ENABLE TRIGGER USER" >/dev/null
apply_change data_layer/backup/rebuild-indicateur-formula-state.sql
assert_equal "1|1" \
  "$(scalar "SELECT (SELECT count(*) FROM private.indicateur_definition_dependance_calcul WHERE indicateur_id = $formula_target_id AND source_identifiant = 'cycle-formula-source-$fixture_suffix') || '|' || (SELECT count(*) FROM private.indicateur_reconciliation_formule)")" \
  "le rebuild valide doit restaurer la projection canonique et préserver la file du snapshot"
scalar "DELETE FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $formula_target_id AND collectivite_id = $collectivite_id" >/dev/null

scalar "UPDATE public.indicateur_valeur SET indicateur_id = $target_id WHERE id = $origin_value_id; UPDATE public.indicateur_valeur SET indicateur_id = $origin_id WHERE id = $origin_value_id" >/dev/null
assert_equal "0" "$(scalar "SELECT count(*) FROM migration.indicateur_valeur_periodicite_audit WHERE valeur_id = $origin_value_id")" \
  "un déplacement aller-retour ne doit pas ressusciter l'audit d'origine"

apply_change data_layer/sqitch/revert/indicateur/periodicite_formules.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite_obligatoire.sql
apply_contract_change data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_formules.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_formules.sql
assert_equal "2020-01-01|0" \
  "$(scalar "SELECT valeur.date_valeur || '|' || count(audit.*) FROM public.indicateur_valeur valeur LEFT JOIN migration.indicateur_valeur_periodicite_audit audit ON audit.valeur_id = valeur.id WHERE valeur.id = $origin_value_id GROUP BY valeur.date_valeur")" \
  "un rejeu du contract ne doit pas recréer un audit obsolète"

apply_change data_layer/sqitch/revert/stats/report_indicateur_resultat_periode.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite_formules.sql
if psql_test --command="INSERT INTO public.indicateur_definition (collectivite_id, titre, unite, periodicite) VALUES ($collectivite_id, 'cycle-garde-$fixture_suffix', 'kWh', 'mensuelle')" >/dev/null 2>&1; then
  echo "ÉCHEC: le garde inter-changements a autorisé une définition mensuelle" >&2
  exit 1
fi

# Le garde de retrait protège aussi les nouveaux états sans définition mensuelle.
for policy_write in \
  "INSERT INTO public.indicateur_collectivite (indicateur_id, collectivite_id, periodicite) VALUES ($emt_second_id, $collectivite_id, 'mensuelle')" \
  "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, periodicite, date_valeur, resultat) VALUES ($emt_second_id, $collectivite_id, 'mensuelle', DATE '2040-01-01', 1)" \
  "UPDATE public.indicateur_definition SET periodicite_mode = 'imposee' WHERE id = $emt_second_id"; do
  if psql_test --command="$policy_write" >/dev/null 2>&1; then
    echo "ÉCHEC: le garde inter-changements a autorisé un état incompatible avec le retrait" >&2
    exit 1
  fi
done

apply_change data_layer/sqitch/revert/indicateur/periodicite_obligatoire.sql
apply_change data_layer/sqitch/revert/indicateur/dependances_formules.sql
apply_change data_layer/sqitch/revert/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/revert/indicateur/import_emt_valeur.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite.sql
assert_equal "0" \
  "$(scalar "SELECT position('iri.periodicite' IN pg_get_functiondef('public.indicateurs_gaz_effet_serre(site_labellisation)'::regprocedure))")" \
  "le revert doit restaurer la projection GES sans dépendance à la colonne supprimée"
assert_equal "2020-01-01" "$(scalar "SELECT date_valeur FROM public.indicateur_valeur WHERE id = $origin_value_id")" \
  "le revert ne doit pas restaurer la date d'un audit invalidé"
assert_equal "1" "$(scalar "SELECT count(*) FROM public.indicateur_valeur WHERE indicateur_id = $concurrency_id AND date_valeur = DATE '2021-02-01'")" \
  "le revert doit restaurer une date dont l'audit est toujours valide"
assert_equal "" "$(scalar "SELECT to_regclass('public.indicateur_periodicite')")" \
  "le revert complet doit retirer le catalogue"
assert_equal "" "$(scalar "SELECT to_regclass('private.indicateur_reconciliation_formule')")" \
  "le revert complet doit retirer la file de réconciliation"
assert_equal "" "$(scalar "SELECT to_regprocedure('private.extraire_dependances_formule_indicateur(text)')")" \
  "le revert complet doit retirer l'extracteur de dépendances"

echo "Cycle Sqitch de périodicité validé sur la base jetable '$database_name'."
