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

ROLLBACK;
