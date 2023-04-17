-- Verify tet:plan_action on pg

BEGIN;

select id,
       collectivite_id,
       fichier_id,
       url,
       titre,
       commentaire,
       modified_by,
       modified_at,
       lien,
       fiche_id
from annexe
where false;

select has_function_privilege('private.ajouter_annexe(annexe)', 'execute');
select has_function_privilege('upsert_fiche_action()', 'execute');
select has_function_privilege('delete_fiche_action()', 'execute');
select has_function_privilege('filter_fiches_action( integer,  integer[],  personne[],  fiche_action_niveaux_priorite[],  fiche_action_statuts[],  personne[])', 'execute');

ROLLBACK;
