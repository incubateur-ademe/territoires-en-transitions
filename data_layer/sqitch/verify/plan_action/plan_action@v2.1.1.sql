-- Verify tet:plan_action on pg

BEGIN;

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
    indicateurs
from fiches_action
where false;

ROLLBACK;
