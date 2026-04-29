-- Deploy tet:historique/fiche_action_indexes to pg
-- requires: plan_action/historique

-- Pas de BEGIN/COMMIT ici : `CREATE INDEX CONCURRENTLY` ne peut pas tourner
-- dans un bloc transactionnel. Sqitch sur PostgreSQL n'enveloppe pas le
-- script en transaction par défaut, chaque statement est donc en autocommit.
--
-- Le trigger save_history sur public.fiche_action lit historique.fiche_action
-- (par fiche_id + modified_at) et historique.fiche_action_pilote (par
-- fiche_historise_id) à chaque INSERT/UPDATE/DELETE. Sans ces index, chaque
-- save fait des seq scans complets sur les deux tables, ce qui dégrade les
-- saves de fiches au fur et à mesure que l'historique grossit.

create index concurrently if not exists fiche_action_fiche_id_modified_at_idx
  on historique.fiche_action (fiche_id, modified_at desc);

create index concurrently if not exists fiche_action_pilote_fiche_historise_id_idx
  on historique.fiche_action_pilote (fiche_historise_id);
