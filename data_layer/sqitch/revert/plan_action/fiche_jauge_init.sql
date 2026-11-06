-- Revert tet:plan_action/fiche_jauge_init from pg

BEGIN;

-- Rien à défaire : la colonne jauge disparaît au revert de plan_action/fiche_jauge.

COMMIT;
