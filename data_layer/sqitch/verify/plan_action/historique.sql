-- Verify tet:plan_action/historique on pg

BEGIN;

select id,
 fiche_id,
 titre,
 previous_titre,
 description,
 previous_description,
 piliers_eci,
 previous_piliers_eci,
 objectifs,
 previous_objectifs,
 resultats_attendus,
 previous_resultats_attendus,
 cibles,
 previous_cibles,
 ressources,
 previous_ressources,
 financements,
 previous_financements,
 budget_previsionnel,
 previous_budget_previsionnel,
 statut,
 previous_statut,
 niveau_priorite,
 previous_niveau_priorite,
 date_debut,
 previous_date_debut,
 date_fin_provisoire,
 previous_date_fin_provisoire,
 amelioration_continue,
 previous_amelioration_continue,
 calendrier,
 previous_calendrier,
 notes_complementaires,
 previous_notes_complementaires,
 maj_termine,
 previous_maj_termine,
 collectivite_id,
 created_at,
 modified_at,
 previous_modified_at,
 modified_by,
 previous_modified_by,
 restreint,
 previous_restreint,
 deleted
from historique.fiche_action
where false;

select id,
 fiche_historise_id,
 user_id,
 tag_nom,
 previous
from historique.fiche_action_pilote
where false;

select has_function_privilege('historique.save_fiche_action()', 'execute');
select has_function_privilege('historique.set_fiche_action_modified_at()', 'execute');



ROLLBACK;
