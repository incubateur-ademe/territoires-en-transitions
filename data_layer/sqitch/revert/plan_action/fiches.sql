-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- On revert pas car il faudrait drop private.fiche_resume pour enlever des colonnes
-- mais il y a trop de dépendances dessus

COMMIT;
