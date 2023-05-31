-- Verify tet:collectivite/historique on pg

BEGIN;

select type,
       collectivite_id,
       modified_by_id,
       previous_modified_by_id,
       modified_at,
       previous_modified_at,
       action_id,
       avancement,
       previous_avancement,
       avancement_detaille,
       previous_avancement_detaille,
       concerne,
       previous_concerne,
       precision,
       previous_precision,
       question_id,
       question_type,
       reponse,
       previous_reponse,
       justification,
       previous_justification,
       modified_by_nom,
       tache_identifiant,
       tache_nom,
       action_identifiant,
       action_nom,
       question_formulation,
       thematique_id,
       thematique_nom,
       action_ids
from historique;

select collectivite_id, modified_by_id, modified_by_nom
from historique_utilisateur
where false;

ROLLBACK;
