-- Verify tet:demarches/pcaet_instruction_validation_supprimee on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT COUNT(*) = 0
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_instruction_validation'
  ), 'La table demarche_pcaet_instruction_validation ne doit plus exister';
END $$;

ROLLBACK;
