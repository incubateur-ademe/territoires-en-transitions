-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege('upsert_fiche_action()', 'execute');
select has_function_privilege('filter_fiches_action( integer,  integer[],  personne[],  fiche_action_niveaux_priorite[],  fiche_action_statuts[],  personne[])', 'execute');

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
       axes,
       actions,
       indicateurs,
       services,
       financeurs,
       fiches_liees
from fiches_action
where false;

ROLLBACK;
