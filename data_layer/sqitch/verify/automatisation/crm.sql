-- Verify tet:utils/automatisation on pg

BEGIN;

select collectivite_id,
       key,
       completude_eci,
       completude_cae,
       fiches,
       plans,
       resultats_indicateurs,
       indicateurs_perso,
       resultats_indicateurs_perso,
       premier_rattachement,
       fiches_initiees,
       fiches_pilotage,
       fiches_indicateur,
       fiches_action_referentiel,
       fiches_fiche_liee,
       fiches_mod_1mois,
       fiches_mod_3mois,
       fiches_mod_6mois,
       pa_date_creation,
       pa_view_2mois,
       pa_view_6mois,
       pa_non_vides,
       pa_pilotables,
       fiches_non_vides,
       fiches_pilotables,
       _5fiches_1pilotage,
       fiches_changement_statut,
       pourcentage_fa_privee,
       pourcentage_fa_pilotable_privee,
       indicateur_prive,
       min1_indicateur_prive,
       min1_indicateur_predef_prive,
       min1_indicateur_perso_prive,
       pourcentage_indicateur_predef_prives,
       pai,
       fiches_pai
from crm_usages
where false;

select id, titre, nb_prive, pourcentage_prive
from crm_indicateurs;

select type, nb_plan, nb_plan_90pc_fa_privees
from crm_plans;

ROLLBACK;
