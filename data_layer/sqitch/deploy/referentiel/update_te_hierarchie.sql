-- Deploy tet:referentiel/update_te_hierarchie to pg

BEGIN;

UPDATE referentiel_definition
SET hierarchie = '{"referentiel", "axe", "sous-axe", "action", "sous-action", "tache"}'
WHERE id IN ('te', 'te-test');

COMMIT;
