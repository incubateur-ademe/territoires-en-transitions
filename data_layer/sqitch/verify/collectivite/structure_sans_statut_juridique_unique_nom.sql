-- Verify tet:collectivite/structure_sans_statut_juridique_unique_nom on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT indexdef ILIKE '%CREATE UNIQUE INDEX%'
      AND indexdef ILIKE '%lower(nom)%'
      AND indexdef ILIKE '%structure_sans_statut_juridique%'
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'collectivite'
      AND indexname = 'collectivite_structure_sans_statut_juridique_unique_nom'
  ), 'L''index unique partiel sur le nom des structures sans statut juridique doit exister';
END $$;

ROLLBACK;
