-- Verify tet:labellisation/prerequis on pg

BEGIN;

comment on type labellisation.etoile is '';
select etoile, prochaine_etoile, long_label, short_label, min_realise_percentage, min_realise_score
from labellisation.etoile_meta
where false;

select etoile,
       prio,
       referentiel,
       action_id,
       formulation,
       min_realise_percentage,
       min_programme_percentage,
       min_realise_score,
       min_programme_score
from labellisation_action_critere
where false;

select referentiel, information
from labellisation_calendrier
where false;

select has_function_privilege('labellisation.referentiel_score(integer)', 'execute');
select has_function_privilege('labellisation.etoiles(integer)', 'execute');
select has_function_privilege('labellisation.critere_score_global(integer)', 'execute');
select has_function_privilege('labellisation.critere_action(integer)', 'execute');

select id, en_cours, collectivite_id, referentiel, etoiles, date
from labellisation.demande
where false;

ROLLBACK;
