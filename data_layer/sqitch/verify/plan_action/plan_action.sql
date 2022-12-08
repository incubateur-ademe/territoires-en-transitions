-- Verify tet:plan_action on pg

BEGIN;
select
    id,
    titre,
    description,
    thematiques,
    piliers_eci,
    objectifs,
    resultats_attendus,
    cibles,
    ressources,
    financements,
    budget_previsionnel,
    statut,
    niveau_priorite,
    date_debut,
    date_fin_provisoire,
    amelioration_continue,
    calendrier,
    notes_complementaires,
    maj_termine,
    collectivite_id
from fiche_action
where false;

select id, nom, collectivite_id, parent
from plan_action
where false;

select fiche_id, plan_id
from fiche_action_plan_action
where false;

select nom, collectivite_id
from tags
where false;

select id, nom, collectivite_id
from partenaires_tags
where false;

select fiche_id, partenaires_tags_id
from fiche_action_partenaires_tags
where false;

select id, nom, collectivite_id
from structures_tags
where false;

select fiche_id, structures_tags_id
from fiche_action_structures_tags
where false;

select id, nom, collectivite_id
from users_tags
where false;

select fiche_id, utilisateur, tags
from fiche_action_pilotes
where false;

select fiche_id, utilisateur, tags
from fiche_action_referents
where false;

select fiche_id, action_id
from fiche_action_action
where false;

select fiche_id, indicateur_id
from fiche_action_indicateur
where false;

select fiche_id, indicateur_id
from fiche_action_indicateur_personnalise
where false;

select
    id,
    collectivite_id,
    fichier_id,
    url,
    titre,
    commentaire,
    modified_by,
    modified_at,
    lien
from annexes
where false;

select fiche_id, annexe_id
from fiche_action_annexes
where false;


select has_function_privilege('upsert_fiche_action_liens(integer,integer[],integer[],integer[],uuid[],integer[],uuid[], integer[], integer[], action_id[])', 'execute');
select has_function_privilege('upsert_fiche_action_plan_action(integer, integer[])', 'execute');
select has_function_privilege('upsert_fiche_action_annexes(integer, integer[])', 'execute');
select has_function_privilege('upsert_fiche_action_referents(integer, integer[], uuid[])', 'execute');
select has_function_privilege('upsert_fiche_action_pilotes(integer, integer[], uuid[])', 'execute');
select has_function_privilege('upsert_fiche_action_structures(integer, integer[])', 'execute');
select has_function_privilege('upsert_fiche_action_partenaires(integer, integer[])', 'execute');
select has_function_privilege('upsert_fiche_action_action(integer, action_id[])', 'execute');
select has_function_privilege('upsert_fiche_action_indicateur(integer, integer[])', 'execute');
select has_function_privilege('upsert_fiche_action_indicateur_personnalise(integer, integer[])', 'execute');

select has_function_privilege('recursive_plan_action(integer)', 'execute');

ROLLBACK;