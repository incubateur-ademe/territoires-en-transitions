-- Verify tet:plan_action on pg

BEGIN;

select nom, collectivite_id
from tag
where false;

select
    id,
    titre,
    description,
    thematiques,
    sous_thematiques,
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

select has_function_privilege('peut_modifier_la_fiche(integer)', 'execute');

select id, nom, collectivite_id, parent
from axe
where false;

select fiche_id, axe_id
from fiche_action_axe
where false;

select has_function_privilege('ajouter_fiche_action_dans_un_axe(integer, integer)', 'execute');
select has_function_privilege('enlever_fiche_action_d_un_axe(integer, integer)', 'execute');
select has_function_privilege('plans_action_collectivite(integer)', 'execute');

select id, nom, collectivite_id
from partenaire_tag
where false;

select fiche_id, partenaire_tag_id
from fiche_action_partenaire_tag
where false;

select has_function_privilege('ajouter_partenaire(integer, partenaire_tag)', 'execute');
select has_function_privilege('enlever_partenaire(integer, partenaire_tag)', 'execute');

select id, nom, collectivite_id
from structure_tag
where false;

select fiche_id, structure_tag_id
from fiche_action_structure_tag
where false;

select has_function_privilege('ajouter_structure(integer, structure_tag)', 'execute');
select has_function_privilege('enlever_structure(integer, structure_tag)', 'execute');


select id, nom, collectivite_id
from personne_tag
where false;

select has_function_privilege('personnes_collectivite(integer)', 'execute');

select fiche_id, utilisateur_uuid, personne_tag_id
from fiche_action_pilote
where false;

select has_function_privilege('ajouter_pilote(integer, personne)', 'execute');
select has_function_privilege('enlever_pilote(integer, personne)', 'execute');

select fiche_id, utilisateur_uuid, personne_tag_id
from fiche_action_referent
where false;

select has_function_privilege('ajouter_referent(integer, personne)', 'execute');
select has_function_privilege('enlever_referent(integer, personne)', 'execute');

select fiche_id, action_id
from fiche_action_action
where false;

select has_function_privilege('ajouter_action(integer, action_id)', 'execute');
select has_function_privilege('enlever_action(integer, action_id)', 'execute');

select fiche_id, indicateur_id
from fiche_action_indicateur
where false;

select has_function_privilege('ajouter_indicateur(integer, indicateur_global)', 'execute');
select has_function_privilege('enlever_indicateur(integer, indicateur_global)', 'execute');
select has_function_privilege('indicateurs_collectivite(integer)', 'execute');

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
from annexe
where false;

select fiche_id, annexe_id
from fiche_action_annexe
where false;

select has_function_privilege('ajouter_annexe(integer, annexe)', 'execute');
select has_function_privilege('enlever_annexe(integer, annexe, boolean)', 'execute');

select has_function_privilege('delete_fiche_action()', 'execute');
select has_function_privilege('upsert_fiche_action()', 'execute');

select has_function_privilege('plan_action(integer)', 'execute');

ROLLBACK;