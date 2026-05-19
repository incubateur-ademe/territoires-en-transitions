-- Revert tet:collectivite/structure_sans_statut_juridique_unique_nom from pg

BEGIN;

DROP INDEX IF EXISTS collectivite_structure_sans_statut_juridique_unique_nom;

COMMIT;
