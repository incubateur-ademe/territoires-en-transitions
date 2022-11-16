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

select id, nom, parent
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

select fiche_id, utilisateur, tag
from fiche_action_pilotes
where false;

select fiche_id, utilisateur, tag
from fiche_action_referents
where false;

select fiche_id, action_id
from fiche_action_action
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

ROLLBACK;