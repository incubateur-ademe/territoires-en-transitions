-- Verify tet:plan_action on pg

BEGIN;

select fiche_une, fiche_deux
from fiche_action_lien
where false;

select fiche_id, fiche_liee_id
from fiches_liees_par_fiche
where false;

select plans,
       fiche_nom,
       fiche_id,
       fiche_statut,
       collectivite_id
from fiche_resume
where false;

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
    financeurs,
    fiches_liees
from fiches_action
where false;

select has_function_privilege('delete_fiche_action()', 'execute');
select has_function_privilege('upsert_fiche_action()', 'execute');

ROLLBACK;
