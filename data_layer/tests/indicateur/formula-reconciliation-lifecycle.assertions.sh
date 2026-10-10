#!/usr/bin/env bash
# Sourced by formula-reconciliation-lifecycle.spec.sh in the disposable CI database.

reconciliation_producer_log="$(mktemp)"
reconciliation_revert_log="$(mktemp)"
reconciliation_reader_log="$(mktemp)"

apply_change data_layer/sqitch/deploy/indicateur/reconciliation_formules.sql
apply_change data_layer/sqitch/verify/indicateur/reconciliation_formules.sql

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

# Le post-traitement de restauration préserve le travail dû, qu'il réussisse
# ou qu'il refuse un catalogue dont les dépendances sont invalides.
scalar "UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id" >/dev/null
scalar "INSERT INTO private.indicateur_reconciliation_formule (generation, indicateur_id, collectivite_id, formule_attendue) VALUES (gen_random_uuid(), $formula_target_id, $collectivite_id, 'val(cycle-formula-source-$fixture_suffix)')" >/dev/null
scalar "ALTER TABLE public.indicateur_definition DISABLE TRIGGER USER; UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-unknown-$fixture_suffix)' WHERE id = $formula_target_id; ALTER TABLE public.indicateur_definition ENABLE TRIGGER USER" >/dev/null
expect_change_failure data_layer/backup/rebuild-indicateur-formula-state.sql \
  "le rebuild doit refuser une dépendance inconnue sans effacer la file"
assert_equal "1" \
  "$(scalar "SELECT count(*) FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $formula_target_id")" \
  "un rebuild échoué doit conserver la file"
scalar "ALTER TABLE public.indicateur_definition DISABLE TRIGGER USER; UPDATE public.indicateur_definition SET valeur_calcule = 'val(cycle-formula-source-$fixture_suffix)' WHERE id = $formula_target_id; ALTER TABLE public.indicateur_definition ENABLE TRIGGER USER" >/dev/null
apply_change data_layer/backup/rebuild-indicateur-formula-state.sql
assert_equal "1" \
  "$(scalar "SELECT count(*) FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $formula_target_id")" \
  "un rebuild réussi doit conserver la file"
scalar "DELETE FROM private.indicateur_reconciliation_formule WHERE indicateur_id = $formula_target_id AND collectivite_id = $collectivite_id" >/dev/null
apply_change data_layer/sqitch/revert/indicateur/reconciliation_formules.sql
assert_equal "" "$(scalar "SELECT to_regclass('private.indicateur_reconciliation_formule')")" \
  "le revert de la seconde livraison doit retirer uniquement la file"
