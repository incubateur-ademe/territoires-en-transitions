-- Verify tet:referentiel/rename_te on pg

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM referentiel_definition
    WHERE id IN ('te', 'te-test') AND nom <> 'Climat Ressources'
  ) THEN
    RAISE EXCEPTION 'referentiel_definition.nom non mis à jour pour te/te-test';
  END IF;
  IF EXISTS (
    SELECT 1 FROM action_definition
    WHERE action_id IN ('te', 'te-test') AND nom <> 'Climat Ressources'
  ) THEN
    RAISE EXCEPTION 'action_definition.nom non mis à jour pour te/te-test';
  END IF;
END $$;

ROLLBACK;
