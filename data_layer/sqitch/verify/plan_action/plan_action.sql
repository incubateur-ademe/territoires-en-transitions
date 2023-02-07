-- Verify tet:plan_action on pg

BEGIN;

select id, nom, collectivite_id
from financeur_tag
where false;

select id, fiche_id, financeur_tag_id, montant_ttc
from fiche_action_financeur_tag
where false;

select has_function_privilege('ajouter_financeur(integer, financeur_montant)', 'execute');

select id, nom, collectivite_id
from service_tag
where false;

select fiche_id, service_tag_id
from fiche_action_service_tag
where false;

select has_function_privilege('ajouter_service(integer, service_tag)', 'execute');
select has_function_privilege('enlever_service(integer, service_tag)', 'execute');

select
    id,
    titre,
    description,
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
    collectivite_id,
    created_at,
    modified_at,
    modified_by,
    thematiques,
    sous_thematiques,
    partenaires,
    structures,
    pilotes,
    referents,
    annexes,
    axes,
    actions,
    indicateurs,
    services,
    financeurs
from fiches_action
where false;

select has_function_privilege('delete_fiche_action()', 'execute');
select has_function_privilege('upsert_fiche_action()', 'execute');

select
    axe,
    sous_axe,
    sous_sous_axe,
    num_action,
    titre,
    description,
    objectifs,
    resultats_attendus,
    cibles,
    structure_pilote,
    moyens,
    partenaires,
    personne_referente,
    elu_referent,
    financements,
    budget,
    statut,
    priorite,
    date_debut,
    date_fin,
    amelioration_continue,
    calendrier,
    notes,
    collectivite_id,
    plan_nom,
    service,
    financeur_un,
    montant_un,
    financeur_deux,
    montant_deux,
    financeur_trois,
    montant_trois
from fiche_action_import_csv
where false;

select has_function_privilege('import_plan_action_csv()', 'execute');

select collectivite_id, id, plan
    from plan_action_profondeur
        where false;

select plan_id, axe_id, collectivite_id, chemin
    from plan_action_chemin
        where false;

select has_function_privilege('plan_action_profondeur(integer, integer)', 'execute');
select has_function_privilege('plan_action(integer)', 'execute');
select has_function_privilege('delete_axe_all(integer)', 'execute');

ROLLBACK;
