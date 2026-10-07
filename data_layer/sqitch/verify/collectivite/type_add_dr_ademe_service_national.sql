-- Verify tet:collectivite/type_add_dr_ademe_service_national on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT pg_get_constraintdef(oid) ILIKE '%''dr_ademe''%'
       AND pg_get_constraintdef(oid) ILIKE '%''service_national''%'
    FROM pg_constraint
    WHERE conname = 'collectivite_type_check'
      AND conrelid = 'public.collectivite'::regclass
  ), 'La contrainte collectivite_type_check doit accepter les types dr_ademe et service_national';

  ASSERT (
    SELECT count(*) = 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'collectivite_dr_ademe_unique_region_code'
  ), 'L''index d''unicité DR ADEME par région doit exister';

  ASSERT (
    SELECT count(*) = 1 FROM pg_constraint
    WHERE conname = 'collectivite_service_national_sans_code_geographique'
      AND conrelid = 'public.collectivite'::regclass
  ), 'Un service national doit être tenu de n''avoir aucun code géographique';
END $$;

ROLLBACK;
