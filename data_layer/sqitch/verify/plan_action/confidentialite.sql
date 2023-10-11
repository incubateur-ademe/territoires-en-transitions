-- Verify tet:plan_action/confidentialite on pg

BEGIN;

select categorie
from plan_action_type_categorie
where false;

select id, categorie, type
from plan_action_type
where false;

select id, nom, collectivite_id, parent, created_at, modified_by, plan, type
from axe
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
    modified_by,
    restreint
from fiche_action
where false;

select plans, titre, id, statut, collectivite_id, pilotes, modified_at, date_fin_provisoire, niveau_priorite, restreint
from private.fiche_resume;

select plans, titre, id, statut, collectivite_id, pilotes, modified_at, date_fin_provisoire, niveau_priorite, restreint
from public.fiche_resume;

select has_function_privilege('upsert_axe_trigger_plan()', 'execute');
select has_function_privilege('peut_lire_la_fiche(integer)', 'execute');
select has_function_privilege('plan_action_tableau_de_bord(integer, integer, boolean)', 'execute');

ROLLBACK;
