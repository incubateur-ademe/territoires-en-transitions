-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('filter_fiches_action( integer,  integer[],  personne[],  fiche_action_niveaux_priorite[],  fiche_action_statuts[],  personne[])', 'execute');

ROLLBACK;
