-- Verify tet:stats/reporting on pg

BEGIN;

select collectivite_id,
       code_siren_insee,
       nom,
       referentiel,
       action_id,
       score_realise,
       score_programme,
       score_realise_plus_programme,
       score_pas_fait,
       score_non_renseigne,
       points_restants,
       points_realises,
       points_programmes,
       points_max_personnalises,
       points_max_referentiel,
       avancement,
       concerne,
       desactive
from stats.report_scores
where false;

select id, thematique_id, type, description, formulation
from stats.report_question
where false;

select question_id, id, formulation
from stats.report_choix
where false;

select collectivite_id, code_siren_insee, nom, question_id, reponse
from stats.report_reponse_choix
where false;

select collectivite_id, code_siren_insee, nom, question_id, reponse
from stats.report_reponse_binaire
where false;

select collectivite_id, code_siren_insee, nom, question_id, reponse
from stats.report_reponse_proportion
where false;

select collectivite_id, code_siren_insee, nom, indicateur_id, annee, valeur
from stats.report_indicateur_resultat
where false;

select has_function_privilege('stats.refresh_reporting()', 'execute');

ROLLBACK;
