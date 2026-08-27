-- Verify tet:collectivite/type_add_ddt on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT pg_get_constraintdef(oid) ILIKE '%''ddt''%'
    FROM pg_constraint
    WHERE conname = 'collectivite_type_check'
      AND conrelid = 'public.collectivite'::regclass
  ), 'La contrainte collectivite_type_check doit accepter le type ddt';

  ASSERT (
    SELECT count(*) = 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'collectivite_ddt_unique_departement_code'
  ), 'L''index d''unicité DDT par département doit exister';
END $$;

ROLLBACK;
