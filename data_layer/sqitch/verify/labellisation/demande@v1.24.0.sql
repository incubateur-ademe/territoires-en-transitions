-- Verify tet:labellisation/demande on pg

BEGIN;

select has_function_privilege('labellisation_demande(integer, referentiel, labellisation.etoile)', 'execute');
select has_function_privilege('labellisation_submit_demande(integer, referentiel, labellisation.etoile)', 'execute');

ROLLBACK;
