-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('upsert_fiche_action()', 'execute');
select has_function_privilege('delete_fiche_action()', 'execute');
select has_function_privilege('filter_fiches_action( integer,  integer[],  personne[],  fiche_action_niveaux_priorite[],  fiche_action_statuts[],  personne[])', 'execute');

select plans,
       titre,
       id,
       statut,
       collectivite_id,
       pilotes
from fiche_resume
where false;

ROLLBACK;
