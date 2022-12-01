-- Deploy tet:referentiel/action_statut_history to pg
-- requires: referentiel/action_statut

BEGIN;

drop function historique.action_statuts_at;

COMMIT;
