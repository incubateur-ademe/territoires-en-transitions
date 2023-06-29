-- Verify tet:retool/correction_droit on pg

BEGIN;

select collectivite_id, nom
from retool_active_collectivite
where false;


select collectivite_id, nom, referentiel, date_debut, date_fin,
       type_audit, envoyee_le, date_attribution
from retool_audit
where false;


select collectivite_id, nom, region_name, departement_name,
       type_collectivite, population_totale,
       code_siren_insee, completude_eci, completude_cae
from retool_completude
where false;

select collectivite_id, nom, completude_eci, completude_cae
from retool_completude_compute
where false;


select id, collectivite_id, referentiel, obtenue_le, annee,
       etoiles, score_realise, score_programme,
       collectivite_nom
from retool_labellisation
where false;


select id, en_cours, collectivite_id, referentiel, etoiles, date,
       nom, sujet, envoyee_le, modified_at,
       demandeur_prenom, demandeur_nom, demandeur_email, demandeur_fonction
from retool_labellisation_demande
where false;

select collectivite_id, nom, nb_plans, nb_fiches, derniere_modif, nb_utilisateurs
from retool_plan_action_usage
where false;

ROLLBACK;
