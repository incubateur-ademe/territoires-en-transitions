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
annual_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite) VALUES ('cycle-annual-$fixture_suffix', 'cycle-annual-$fixture_suffix', 'kWh') RETURNING id")"
rollback_guard_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite) VALUES ('cycle-rollback-guard-$fixture_suffix', 'cycle-rollback-guard-$fixture_suffix', 'kWh') RETURNING id")"
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
annual_definition_log="$(mktemp)"
annual_writer_log="$(mktemp)"
reconciliation_producer_log="$(mktemp)"
reconciliation_revert_log="$(mktemp)"
reconciliation_reader_log="$(mktemp)"
trap 'rm -f "$expand_migration_log" "$expand_delete_log" "$transition_log" "$contract_writer_log" "$graph_definition_log" "$graph_value_log" "$formula_source_log" "$formula_target_log" "$annual_definition_log" "$annual_writer_log" "$reconciliation_producer_log" "$reconciliation_revert_log" "$reconciliation_reader_log" "${cleanup_dump:-}"; if [[ -n "${restore_guard_directory:-}" ]]; then rm -rf "$restore_guard_directory"; fi' EXIT

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

apply_change data_layer/sqitch/deploy/indicateur/periodicite_schema.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_schema.sql
apply_change data_layer/sqitch/deploy/indicateur/correct-formule-cae-2-a.sql
apply_change data_layer/sqitch/verify/indicateur/correct-formule-cae-2-a.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite.sql
apply_change data_layer/sqitch/deploy/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/verify/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/deploy/indicateur/dependances_formules.sql
apply_change data_layer/sqitch/verify/indicateur/dependances_formules.sql
assert_equal "2020-01-01|2020-02-01|normalisee" \
  "$(scalar "SELECT valeur.date_valeur || '|' || audit.date_valeur_avant || '|' || audit.statut FROM public.indicateur_valeur valeur JOIN migration.indicateur_valeur_periodicite_audit audit ON audit.valeur_id = valeur.id WHERE valeur.id = $origin_value_id")" \
  "l'expand doit normaliser et auditer une date historique sans collision"
assert_equal "2" "$(scalar "SELECT count(*) FROM migration.indicateur_valeur_periodicite_audit WHERE indicateur_id = $conflict_id AND statut = 'conflit'")" \
  "l'expand doit auditer sans fusionner les collisions historiques"

expect_change_failure data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql \
  "le contract doit refuser un audit contenant encore des conflits"
scalar "DELETE FROM public.indicateur_valeur WHERE indicateur_id = $conflict_id AND date_valeur = DATE '2019-03-01'; UPDATE public.indicateur_valeur SET date_valeur = DATE '2019-01-01' WHERE indicateur_id = $conflict_id" >/dev/null
assert_equal "0" "$(scalar "SELECT count(*) FROM migration.indicateur_valeur_periodicite_audit WHERE indicateur_id = $conflict_id")" \
  "la remédiation explicite doit assainir les audits de conflit"

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

# La cadence est fixée dès création, avant même la première déclaration.
if psql_test --command="UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $annual_id" >/dev/null 2>&1; then
  echo "ÉCHEC: une définition sans valeur a changé de périodicité" >&2
  exit 1
fi
assert_equal "annuelle|0" \
  "$(scalar "SELECT definition.periodicite || '|' || count(valeur.*) FROM public.indicateur_definition definition LEFT JOIN public.indicateur_valeur valeur ON valeur.indicateur_id = definition.id WHERE definition.id = $annual_id GROUP BY definition.periodicite")" \
  "la définition reste annuelle avant sa première valeur"

# Si le writer annuel gagne, il conserve son verrou partagé jusqu'au commit.
# La mutation attend, puis le garde d'immuabilité protège toujours la cadence.
psql_test --command="SET application_name = 'periodicite-lifecycle-annual-writer'; BEGIN; SELECT pg_advisory_xact_lock_shared(hashtextextended('indicateur-calculation-graph', 0)); SELECT id FROM public.indicateur_definition WHERE id = $annual_id FOR SHARE; SELECT pg_sleep(3); INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, periodicite, date_valeur, resultat) VALUES ($annual_id, $collectivite_id, 'annuelle', DATE '2030-01-01', 0); COMMIT" >"$annual_writer_log" 2>&1 &
annual_writer_pid=$!
wait_for_sleeping_session periodicite-lifecycle-annual-writer
psql_test --command="SET application_name = 'periodicite-lifecycle-annual-definition'; UPDATE public.indicateur_definition SET periodicite = 'mensuelle' WHERE id = $annual_id" >"$annual_definition_log" 2>&1 &
annual_definition_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-annual-definition
wait "$annual_writer_pid"
if wait "$annual_definition_pid"; then
  echo "ÉCHEC: un changement concurrent a invalidé la cadence d'une valeur annuelle validée" >&2
  exit 1
fi
assert_equal "annuelle|1|0" \
  "$(scalar "SELECT definition.periodicite || '|' || count(valeur.*) || '|' || min(valeur.resultat) FROM public.indicateur_definition definition LEFT JOIN public.indicateur_valeur valeur ON valeur.indicateur_id = definition.id WHERE definition.id = $annual_id GROUP BY definition.periodicite")" \
  "l'écriture annuelle validée en premier doit conserver la cadence, la ligne et la valeur zéro"

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
  --file="$repository_root/data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql" >/dev/null
wait "$contract_writer_pid"
apply_change data_layer/sqitch/verify/indicateur/periodicite_obligatoire.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_formules.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_formules.sql

formula_source_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite, periodicite) VALUES ('cycle-formula-source-$fixture_suffix', 'cycle-formula-source-$fixture_suffix', 'kWh', 'annuelle') RETURNING id")"
formula_target_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite, periodicite) VALUES ('cycle-formula-target-$fixture_suffix', 'cycle-formula-target-$fixture_suffix', 'kWh', 'annuelle') RETURNING id")"

# Le verrou exclusif du graphe sérialise la création de formule avec les
# mutations de sa source. Une cadence fixée à la création ne peut pas changer.
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

# Une suppression concurrente de source ne laisse pas une nouvelle formule
# référencer une définition disparue, même si aucune valeur n'est enregistrée.
scalar "UPDATE public.indicateur_definition SET valeur_calcule = NULL WHERE id = $formula_target_id" >/dev/null
psql_test --command="SET application_name = 'periodicite-lifecycle-formula-source'; BEGIN; DELETE FROM public.indicateur_definition WHERE id = $formula_source_id; SELECT pg_sleep(3); COMMIT" >"$formula_source_log" 2>&1 &
formula_source_pid=$!
wait_for_sleeping_session periodicite-lifecycle-formula-source
psql_test --command="SET application_name = 'periodicite-lifecycle-formula-target'; UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id" >"$formula_target_log" 2>&1 &
formula_target_pid=$!
wait_for_advisory_lock_session periodicite-lifecycle-formula-target
wait "$formula_source_pid"
if wait "$formula_target_pid"; then
  echo "ÉCHEC: une formule concurrente a accepté une source supprimée" >&2
  exit 1
fi
assert_equal "0" \
  "$(scalar "SELECT count(*) FROM private.indicateur_definition_dependance_calcul WHERE indicateur_id = $formula_target_id")" \
  "la suppression validée en premier fait échouer la nouvelle formule sans laisser de projection"
formula_source_id="$(scalar "INSERT INTO public.indicateur_definition (identifiant_referentiel, titre, unite, periodicite) VALUES ('cycle-formula-source-$fixture_suffix', 'Source annuelle', 'kWh', 'annuelle') RETURNING id")"

apply_change data_layer/sqitch/deploy/stats/report_indicateur_resultat_periode.sql
apply_change data_layer/sqitch/verify/stats/report_indicateur_resultat_periode.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_annuelle.sql
apply_change data_layer/sqitch/deploy/indicateur/reserver-ecriture-valeurs-backend.sql
apply_change data_layer/sqitch/verify/indicateur/reserver-ecriture-valeurs-backend.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_activation.sql
release_test_output="$(psql_test --file="$repository_root/data_layer/tests/indicateur/periodicite-release.sql")"
if [[ "$release_test_output" == *"not ok"* || "$release_test_output" == *"Looks like"* ]]; then
  printf '%s\n' "$release_test_output" >&2
  exit 1
fi
# Le retour à la livraison annuelle doit refuser les nouvelles données sans
# retirer partiellement les capacités de la livraison activée ni perdre de
# valeur, de commentaire, de provenance ou de règle de restitution.
assert_activation_survives_failed_revert() {
  expect_change_failure data_layer/sqitch/revert/indicateur/periodicite_activation.sql \
    "le retour à l'annuel doit refuser un état activé incompatible"
  apply_change data_layer/sqitch/verify/indicateur/periodicite_activation.sql
}

for cadence in mensuelle trimestrielle semestrielle; do
  activated_id="$(scalar "INSERT INTO public.indicateur_definition (collectivite_id, titre, unite, periodicite) VALUES ($collectivite_id, 'cycle-activation-$cadence-$fixture_suffix', 'kWh', '$cadence') RETURNING id")"
  activated_value_id="$(scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, periodicite, resultat, objectif, resultat_commentaire, objectif_commentaire) VALUES ($activated_id, $collectivite_id, DATE '2042-01-01', '$cadence', 0, NULL, 'Résultat à conserver', 'Objectif absent à conserver') RETURNING id")"
  activated_before="$(scalar "SELECT to_jsonb(valeur) FROM public.indicateur_valeur valeur WHERE id = $activated_value_id")"
  assert_activation_survives_failed_revert
  assert_equal "$activated_before" \
    "$(scalar "SELECT to_jsonb(valeur) FROM public.indicateur_valeur valeur WHERE id = $activated_value_id")" \
    "le refus du retour à l'annuel conserve intégralement la valeur $cadence"
  scalar "DELETE FROM public.indicateur_valeur WHERE id = $activated_value_id; DELETE FROM public.indicateur_definition WHERE id = $activated_id" >/dev/null
done

# Une source importée peut avoir une cadence propre, même si toutes les
# définitions locales restent annuelles : le contrôle doit aussi lire les valeurs.
scalar "INSERT INTO public.indicateur_source (id, libelle) VALUES ('cycle-source-$fixture_suffix', 'Source de cycle de vie')" >/dev/null
activated_metadonnee_id="$(scalar "INSERT INTO public.indicateur_source_metadonnee (source_id, date_version) VALUES ('cycle-source-$fixture_suffix', TIMESTAMP '2042-01-01') RETURNING id")"
activated_value_id="$(scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, periodicite, metadonnee_id, resultat) VALUES ($rollback_guard_id, $collectivite_id, DATE '2042-01-01', 'mensuelle', $activated_metadonnee_id, 0) RETURNING id")"
activated_before="$(scalar "SELECT to_jsonb(valeur) FROM public.indicateur_valeur valeur WHERE id = $activated_value_id")"
assert_activation_survives_failed_revert
assert_equal "$activated_before" \
  "$(scalar "SELECT to_jsonb(valeur) FROM public.indicateur_valeur valeur WHERE id = $activated_value_id")" \
  "le refus conserve la valeur importée et sa provenance sans contrainte annuelle partielle"
scalar "DELETE FROM public.indicateur_valeur WHERE id = $activated_value_id; DELETE FROM public.indicateur_source_metadonnee WHERE id = $activated_metadonnee_id; DELETE FROM public.indicateur_source WHERE id = 'cycle-source-$fixture_suffix'" >/dev/null

for aggregation_column in aggregation_resultat aggregation_objectif; do
  scalar "UPDATE public.indicateur_definition SET $aggregation_column = 'somme' WHERE id = $rollback_guard_id" >/dev/null
  activated_before="$(scalar "SELECT to_jsonb(definition) FROM public.indicateur_definition definition WHERE id = $rollback_guard_id")"
  assert_activation_survives_failed_revert
  assert_equal "$activated_before" \
    "$(scalar "SELECT to_jsonb(definition) FROM public.indicateur_definition definition WHERE id = $rollback_guard_id")" \
    "le refus conserve la configuration $aggregation_column et les métadonnées de la définition"
  scalar "UPDATE public.indicateur_definition SET $aggregation_column = NULL WHERE id = $rollback_guard_id" >/dev/null
done

apply_change data_layer/sqitch/revert/indicateur/periodicite_activation.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_annuelle.sql
apply_change data_layer/sqitch/revert/indicateur/reserver-ecriture-valeurs-backend.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite_annuelle.sql

scalar "UPDATE public.indicateur_valeur SET indicateur_id = $target_id WHERE id = $origin_value_id; UPDATE public.indicateur_valeur SET indicateur_id = $origin_id WHERE id = $origin_value_id" >/dev/null
assert_equal "0" "$(scalar "SELECT count(*) FROM migration.indicateur_valeur_periodicite_audit WHERE valeur_id = $origin_value_id")" \
  "un déplacement aller-retour ne doit pas ressusciter l'audit d'origine"

apply_change data_layer/sqitch/revert/indicateur/periodicite_formules.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite_obligatoire.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_obligatoire.sql
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
  "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, periodicite, date_valeur, resultat) VALUES ($rollback_guard_id, $collectivite_id, 'mensuelle', DATE '2040-01-01', 1)" \
  "UPDATE public.indicateur_definition SET aggregation_resultat = 'somme' WHERE id = $rollback_guard_id"; do
  if psql_test --command="$policy_write" >/dev/null 2>&1; then
    echo "ÉCHEC: le garde inter-changements a autorisé un état incompatible avec le retrait" >&2
    exit 1
  fi
done

apply_change data_layer/sqitch/revert/indicateur/periodicite_obligatoire.sql
apply_change data_layer/sqitch/revert/indicateur/dependances_formules.sql
apply_change data_layer/sqitch/revert/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_schema.sql
apply_change data_layer/sqitch/revert/indicateur/periodicite_schema.sql
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

# Cinquième livraison autonome : migration mensuelle de Margny.
for change in periodicite_schema periodicite reconciliation_formules dependances_formules \
              periodicite_obligatoire periodicite_formules; do
  apply_change "data_layer/sqitch/deploy/indicateur/$change.sql"
done
apply_change data_layer/sqitch/deploy/stats/report_indicateur_resultat_periode.sql
apply_change data_layer/sqitch/deploy/indicateur/periodicite_annuelle.sql
apply_change data_layer/sqitch/deploy/indicateur/reserver-ecriture-valeurs-backend.sql
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "la conversion de Margny doit attendre l'activation"
expect_change_failure data_layer/sqitch/deploy/indicateur/periodicite_nettoyage.sql \
  "le nettoyage doit attendre l'activation et la migration métier"
apply_change data_layer/sqitch/deploy/indicateur/periodicite_activation.sql
# Réintégration mensuelle de Margny : refuser toute dérive depuis #5220.
apply_change data_layer/tests/indicateur/fixtures/margny-monthly.psql
scalar "UPDATE private.indicateur_valeur_date_repair SET valeur_id = -valeur_id, avant = jsonb_set(avant, '{id}', to_jsonb(-valeur_id)) WHERE valeur_id = 11979621" >/dev/null
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "une archive partielle de Margny doit bloquer la conversion"
scalar "UPDATE private.indicateur_valeur_date_repair SET valeur_id = -valeur_id, avant = jsonb_set(avant, '{id}', to_jsonb(-valeur_id)) WHERE valeur_id = -11979621" >/dev/null
scalar "UPDATE public.indicateur_valeur SET resultat = 77 WHERE id = 11979624" >/dev/null
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "une saisie de Margny modifiée entre les livraisons ne doit pas être écrasée"
assert_equal "77" "$(scalar "SELECT resultat FROM public.indicateur_valeur WHERE id = 11979624")" \
  "la saisie modifiée doit rester intacte après le refus"
scalar "BEGIN; ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at; ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
UPDATE public.indicateur_valeur v SET resultat = (a.apres->>'resultat')::double precision, modified_at = (a.apres->>'modified_at')::timestamptz, modified_by = (a.apres->>'modified_by')::uuid FROM private.indicateur_valeur_date_repair a WHERE v.id = a.valeur_id AND v.id = 11979624;
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by; ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at; COMMIT" >/dev/null
scalar "INSERT INTO public.indicateur_valeur (id, indicateur_id, collectivite_id, date_valeur, resultat) VALUES (11979621, $origin_id, $collectivite_id, '2070-01-01', 1)" >/dev/null
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "un identifiant réutilisé depuis l'archivage de Margny ne doit pas être écrasé"
scalar "DELETE FROM public.indicateur_valeur WHERE id = 11979621" >/dev/null
margny_extra_id="$(scalar "INSERT INTO public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, resultat) VALUES (31816, 2181, '2030-01-01', 1) RETURNING id")"
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "une nouvelle année de Margny doit exiger une décision avant conversion"
scalar "DELETE FROM public.indicateur_valeur WHERE id = $margny_extra_id" >/dev/null
scalar "INSERT INTO public.indicateur_groupe (parent, enfant) VALUES (31816, $origin_id)" >/dev/null
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "une dépendance annuelle nouvelle doit bloquer la conversion de Margny"
scalar "DELETE FROM public.indicateur_groupe WHERE parent = 31816 AND enfant = $origin_id" >/dev/null
# Un trigger inattendu qui ignore l'UPDATE doit faire annuler même les INSERT
# déjà exécutés : aucun nettoyage ne doit masquer une conversion incomplète.
psql_test <<'SQL' >/dev/null
CREATE FUNCTION private.ignore_margny_periodicite_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN OLD; END $$;
CREATE TRIGGER ignore_margny_periodicite_test BEFORE UPDATE OF periodicite ON public.indicateur_definition
FOR EACH ROW WHEN (OLD.id IN (31816,32392)) EXECUTE FUNCTION private.ignore_margny_periodicite_test();
SQL
expect_change_failure data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql \
  "une conversion de définition ignorée doit annuler aussi les valeurs restaurées"
assert_equal "2|6|annuelle,annuelle" \
  "$(scalar "SELECT (SELECT count(*) FROM public.indicateur_valeur WHERE indicateur_id IN (31816,32392)) || '|' || (SELECT count(*) FROM private.indicateur_valeur_date_repair WHERE valeur_id IN (11979621,11979622,11979623,11979624,12374016,12374017)) || '|' || (SELECT string_agg(periodicite, ',' ORDER BY id) FROM public.indicateur_definition WHERE id IN (31816,32392))")" \
  "le refus après écriture restaure entièrement observations, définitions et archives"
scalar "DROP TRIGGER ignore_margny_periodicite_test ON public.indicateur_definition; DROP FUNCTION private.ignore_margny_periodicite_test()" >/dev/null
margny_definitions_expected="$(scalar "SELECT jsonb_agg(to_jsonb(d) || jsonb_build_object('periodicite', 'mensuelle') ORDER BY id) FROM public.indicateur_definition d WHERE id IN (31816,32392)")"
margny_expected="$(scalar "SELECT jsonb_agg(avant || jsonb_build_object('periodicite', 'mensuelle', 'date_valeur', make_date(2025, extract(year from (avant->>'date_valeur')::date)::integer % 100, 1)) ORDER BY valeur_id) FROM private.indicateur_valeur_date_repair WHERE valeur_id IN (11979621,11979622,11979623,11979624,12374016,12374017)")"


margny_before="$(scalar "SELECT jsonb_build_object(
 'definitions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM public.indicateur_definition d),
 'valeurs',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.indicateur_valeur v),
 'archives',(SELECT jsonb_agg(to_jsonb(a) ORDER BY valeur_id) FROM private.indicateur_valeur_date_repair a))")"
apply_change data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql
apply_change data_layer/sqitch/verify/indicateur/margny_indicateurs_mensuels.sql
assert_equal "$margny_expected" \
  "$(scalar "SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.indicateur_valeur v WHERE indicateur_id IN (31816,32392)")" \
  "les six originaux de Margny deviennent mensuels avec leurs valeurs, commentaires, auteurs et horodatages"
assert_equal "$margny_definitions_expected" "$(scalar "SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM public.indicateur_definition d WHERE id IN (31816,32392)")" \
  "la correction préserve intégralement les définitions en changeant uniquement leur cadence"
assert_equal "mensuelle,mensuelle" "$(scalar "SELECT string_agg(periodicite, ',' ORDER BY id) FROM public.indicateur_definition WHERE id IN (31816,32392)")" \
  "les deux indicateurs existants de Margny deviennent mensuels"
if psql_test --command="UPDATE public.indicateur_definition SET periodicite = 'annuelle' WHERE id = 31816" >/dev/null 2>&1; then
  echo "ÉCHEC: la conversion ponctuelle a laissé la périodicité modifiable" >&2
  exit 1
fi
if psql_test --command="UPDATE public.indicateur_valeur SET periodicite = 'annuelle' WHERE id = 11979621" >/dev/null 2>&1; then
  echo "ÉCHEC: la conversion ponctuelle a laissé la périodicité des valeurs modifiable" >&2
  exit 1
fi

assert_equal "migration.indicateur_valeur_periodicite_audit|private.indicateur_valeur_write_acl|private.indicateur_valeur_date_repair" \
  "$(scalar "SELECT to_regclass('migration.indicateur_valeur_periodicite_audit') || '|' || to_regclass('private.indicateur_valeur_write_acl') || '|' || to_regclass('private.indicateur_valeur_date_repair')")" \
  "la migration de Margny doit conserver les trois archives jusqu'au nettoyage"
scalar "BEGIN; ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at; ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by; UPDATE public.indicateur_valeur SET resultat = 77 WHERE id = 11979624; COMMIT" >/dev/null
expect_change_failure data_layer/sqitch/revert/indicateur/margny_indicateurs_mensuels.sql \
  "le retour arrière de Margny doit refuser une saisie modifiée"
assert_equal "77" "$(scalar "SELECT resultat FROM public.indicateur_valeur WHERE id = 11979624")" \
  "le refus du revert ne doit pas écraser une saisie modifiée"
scalar "UPDATE public.indicateur_valeur SET resultat = 8 WHERE id = 11979624; ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by; ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at" >/dev/null
apply_change data_layer/sqitch/revert/indicateur/margny_indicateurs_mensuels.sql
assert_equal "$margny_before" "$(scalar "SELECT jsonb_build_object(
 'definitions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM public.indicateur_definition d),
 'valeurs',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.indicateur_valeur v),
 'archives',(SELECT jsonb_agg(to_jsonb(a) ORDER BY valeur_id) FROM private.indicateur_valeur_date_repair a))")" \
  "le retour arrière doit restaurer exactement les images annuelles et conserver les archives"
apply_change data_layer/sqitch/deploy/indicateur/margny_indicateurs_mensuels.sql
apply_change data_layer/sqitch/verify/indicateur/margny_indicateurs_mensuels.sql
echo "Migration autonome de Margny, conservation des archives et retour arrière contrôlé validés."


# Sixième livraison autonome : aucune conversion de données.
expect_change_failure data_layer/sqitch/deploy/indicateur/periodicite_nettoyage.sql \
  "le nettoyage doit attendre l'enregistrement de la migration de Margny"
scalar "INSERT INTO sqitch.projects (project,creator_name,creator_email) VALUES ('tet','test','test@example.invalid') ON CONFLICT DO NOTHING" >/dev/null
for change in indicateur/periodicite_schema indicateur/periodicite indicateur/reconciliation_formules \
              indicateur/dependances_formules indicateur/periodicite_obligatoire indicateur/periodicite_formules \
              stats/report_indicateur_resultat_periode indicateur/periodicite_annuelle \
              indicateur/periodicite_activation indicateur/margny_indicateurs_mensuels; do
  scalar "INSERT INTO sqitch.changes (change_id,change,project,committer_name,committer_email,planned_at,planner_name,planner_email) VALUES (md5('$change'),'$change','tet','test','test@example.invalid',now(),'test','test@example.invalid') ON CONFLICT DO NOTHING" >/dev/null
done
scalar "INSERT INTO migration.indicateur_valeur_periodicite_audit (valeur_id,indicateur_id,collectivite_id,periodicite,date_valeur_avant,date_valeur_canonique,statut) VALUES (-1,$origin_id,$collectivite_id,'annuelle','2050-02-01','2050-01-01','conflit')" >/dev/null
expect_change_failure data_layer/sqitch/deploy/indicateur/periodicite_nettoyage.sql \
  "le nettoyage doit refuser un conflit non résolu"
scalar "DELETE FROM migration.indicateur_valeur_periodicite_audit WHERE valeur_id = -1" >/dev/null
scalar "INSERT INTO private.indicateur_reconciliation_formule (generation,indicateur_id,collectivite_id,formule_attendue) VALUES (gen_random_uuid(),$formula_target_id,$collectivite_id,'val(cycle-formula-source-$fixture_suffix)')" >/dev/null
cleanup_snapshot_sql="SELECT jsonb_build_object(
 'valeurs',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.indicateur_valeur v),
 'definitions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM public.indicateur_definition d),
 'queue',(SELECT jsonb_agg(to_jsonb(q) ORDER BY id) FROM private.indicateur_reconciliation_formule q),
 'acl',(SELECT relacl FROM pg_class WHERE oid = 'public.indicateur_valeur'::regclass))"
cleanup_before="$(scalar "$cleanup_snapshot_sql")"
apply_change data_layer/sqitch/deploy/indicateur/periodicite_nettoyage.sql
apply_change data_layer/sqitch/verify/indicateur/periodicite_nettoyage.sql
assert_equal "$cleanup_before" "$(scalar "$cleanup_snapshot_sql")" \
  "le nettoyage doit préserver intégralement toutes les données métier, y compris Margny"
assert_equal "||" "$(scalar "SELECT coalesce(to_regclass('migration.indicateur_valeur_periodicite_audit')::text,'') || '|' || coalesce(to_regclass('private.indicateur_valeur_write_acl')::text,'') || '|' || coalesce(to_regclass('private.indicateur_valeur_date_repair')::text,'')")" \
  "le nettoyage doit retirer les trois archives temporaires"
expect_change_failure data_layer/sqitch/revert/indicateur/periodicite_nettoyage.sql \
  "le retour arrière après nettoyage doit être explicitement refusé"
assert_equal "$cleanup_before" "$(scalar "$cleanup_snapshot_sql")" \
  "le refus du revert ne doit avoir aucun effet de bord"
scalar "INSERT INTO sqitch.changes (change_id,change,project,committer_name,committer_email,planned_at,planner_name,planner_email) VALUES (md5('indicateur/periodicite_nettoyage'),'indicateur/periodicite_nettoyage','tet','test','test@example.invalid',now(),'test','test@example.invalid')" >/dev/null
for change in periodicite_schema periodicite periodicite_obligatoire periodicite_formules \
              reconciliation_formules reserver-ecriture-valeurs-backend periodicite_activation \
              margny_indicateurs_mensuels correct-dates-historiques; do
  apply_change "data_layer/sqitch/verify/indicateur/$change.sql"
done
apply_change data_layer/backup/rebuild-indicateur-formula-state.sql
assert_equal "$cleanup_before" "$(scalar "$cleanup_snapshot_sql")" \
  "le rebuild après nettoyage préserve les données et le travail restant"
echo "Nettoyage final, conservation des données et refus du retour arrière validés."

# Vraies archives et vrai catalogue PostgreSQL, au-delà de la matrice shell.
cleanup_dump="$(mktemp)"
pg_dump --format=custom --dbname="$database_url" --file="$cleanup_dump"
TO_DB_URL="$database_url" bash "$repository_root/data_layer/backup/check-restore-compatibility.sh" "$cleanup_dump"
# Exercer la file durable par un vrai aller-retour pg_dump/pg_restore.
scalar "TRUNCATE private.indicateur_reconciliation_formule" >/dev/null
# Les clients PG17 ajoutent ce SET, inconnu du serveur PG15 de test.
pg_restore --data-only --file=- --schema=private \
  --table=indicateur_reconciliation_formule "$cleanup_dump" \
  | sed '/^SET transaction_timeout = 0;$/d' | psql_test >/dev/null
apply_change data_layer/backup/rebuild-indicateur-formula-state.sql
assert_equal "$cleanup_before" "$(scalar "$cleanup_snapshot_sql")" \
  "la restauration conserve les recalculs sans réinventer les archives supprimées"
scalar "ALTER TABLE public.indicateur_valeur DISABLE TRIGGER verifier_date_valeur_selon_periodicite" >/dev/null
if TO_DB_URL="$database_url" bash "$repository_root/data_layer/backup/check-restore-compatibility.sh" "$cleanup_dump" >/dev/null 2>&1; then
  echo "ÉCHEC: une cible nettoyée sans validation des dates a été acceptée" >&2
  exit 1
fi
scalar "ALTER TABLE public.indicateur_valeur ENABLE TRIGGER verifier_date_valeur_selon_periodicite" >/dev/null
# Exécuter aussi le vrai point d'entrée : le refus doit précéder même la lecture
# des groupes YAML, puis le premier TRUNCATE. Le double yq ne sera jamais appelé.
restore_guard_directory="$(mktemp -d)"
printf '#!/bin/bash\necho "Unexpected YAML parsing before compatibility refusal" >&2\nexit 99\n' > "$restore_guard_directory/yq"
chmod +x "$restore_guard_directory/yq"
for missing_table in private.indicateur_reconciliation_formule; do
  pg_dump --format=custom --dbname="$database_url" --exclude-table-data="$missing_table" --file="$cleanup_dump"
  if PATH="$restore_guard_directory:$PATH" CI=true TO_DB_URL="$database_url" \
      bash "$repository_root/data_layer/backup/restore.sh" "$cleanup_dump" \
      > "$restore_guard_directory/restore.log" 2>&1; then
    echo "ÉCHEC: une sauvegarde privée de $missing_table a été acceptée" >&2
    exit 1
  fi
  if ! rg -q 'backup lacks formula reconciliation data' "$restore_guard_directory/restore.log"; then
    cat "$restore_guard_directory/restore.log" >&2
    echo "ÉCHEC: la restauration a échoué avant d'exercer le contrôle attendu" >&2
    exit 1
  fi
done
assert_equal "$cleanup_before" "$(scalar "$cleanup_snapshot_sql")" \
  "les contrôles de restauration ne modifient aucune donnée"
echo "Archives réelles après nettoyage et refus des dérives validés."

# Une restauration charge indicateur_definition avec les triggers USER coupés.
# Simule cet état, puis vérifie que le post-traitement reconstruit la projection,
# valide le graphe atomiquement et préserve les réconciliations encore dues.
scalar "UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id" >/dev/null
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

echo "Reconstruction atomique du graphe final et conservation de la file validées."
