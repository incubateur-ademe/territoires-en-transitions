-- Verify tet:collectivite/type_add_dreal on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT pg_get_constraintdef(oid) ILIKE '%''dreal''%'
    FROM pg_constraint
    WHERE conname = 'collectivite_type_check'
      AND conrelid = 'public.collectivite'::regclass
  ), 'La contrainte collectivite_type_check doit accepter le type dreal';
END $$;

ROLLBACK;
