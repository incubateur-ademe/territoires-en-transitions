-- Revert tet:referentiel/update_te_hierarchie from pg

BEGIN;

UPDATE referentiel_definition
SET hierarchie = '{"referentiel", "axe", "sous-axe", "action", "sous-action", "exemple"}'
WHERE id IN ('te', 'te-test');

COMMIT;
