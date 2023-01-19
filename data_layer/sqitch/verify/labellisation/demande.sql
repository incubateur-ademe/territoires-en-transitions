-- Verify tet:labellisation/demande on pg

BEGIN;

select has_function_privilege('labellisation_demande(integer, referentiel, labellisation.etoile)', 'execute');
select has_function_privilege('labellisation_submit_demande(integer, referentiel, labellisation.etoile, labellisation.sujet_demande)', 'execute');
select has_function_privilege('labellisation.validation_demande()', 'execute');
select has_function_privilege('labellisation_parcours(integer)', 'execute');

ROLLBACK;
