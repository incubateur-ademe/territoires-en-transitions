-- Verify tet:plan_action on pg

BEGIN;

select modified_at,
       uid,
       collectivite_id,
       avancement,
       numerotation,
       titre,
       description,
       structure_pilote,
       personne_referente,
       elu_referent,
       partenaires,
       budget_global,
       commentaire,
       date_fin,
       date_debut,
       en_retard,
       action_ids,
       indicateur_ids,
       indicateur_personnalise_ids
from fiche_action
where false;

select fiche_action_uid, action_id
from fiche_action_action
where false;

select fiche_action_uid, indicateur_id
from fiche_action_indicateur
where false;

select fiche_action_uid, indicateur_personnalise_id
from fiche_action_indicateur_personnalise
where false;

select has_function_privilege('update_fiche_relationships(uuid, action_id[], indicateur_id[], integer[])', 'execute');
select has_function_privilege('after_fiche_action_write_save_relationships()', 'execute');

select uid, collectivite_id, nom, categories, fiches_by_category, created_at, modified_at
from plan_action
where false;

select has_function_privilege('after_collectivite_insert_default_plan()', 'execute');

ROLLBACK;
