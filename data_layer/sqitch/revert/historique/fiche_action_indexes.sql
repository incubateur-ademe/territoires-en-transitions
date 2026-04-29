-- Revert tet:historique/fiche_action_indexes from pg

-- Pas de BEGIN/COMMIT : `DROP INDEX CONCURRENTLY` ne peut pas tourner dans
-- un bloc transactionnel, comme son pendant CREATE.

drop index concurrently if exists historique.fiche_action_pilote_fiche_historise_id_idx;
drop index concurrently if exists historique.fiche_action_fiche_id_modified_at_idx;
