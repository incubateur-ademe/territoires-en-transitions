-- Verify tet:referentiel/referentiel on pg

BEGIN;

SELECT 1/COUNT(*) FROM referentiel_definition;

SELECT 1/COUNT(*) FROM action_definition WHERE referentiel_id = 'cae';

SELECT 1/COUNT(*) FROM action_definition WHERE referentiel_id = 'eci';

ROLLBACK;
