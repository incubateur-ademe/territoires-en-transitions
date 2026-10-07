-- Verify tet:demarche/pcaet_diagnostic_indicateur_source_metadonnee on pg

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'demarche_pcaet_source_metadonnee'
  ) THEN
    RAISE EXCEPTION 'Table public.demarche_pcaet_source_metadonnee does not exist';
  END IF;
END $$;

-- La table doit avoir une clé primaire sur (demarche_id, collectivite_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'demarche_pcaet_source_metadonnee'
      AND c.contype = 'p'
  ) THEN
    RAISE EXCEPTION 'Primary key on public.demarche_pcaet_source_metadonnee is missing';
  END IF;
END $$;

-- RLS activée sur la table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'demarche_pcaet_source_metadonnee'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on public.demarche_pcaet_source_metadonnee';
  END IF;
END $$;

-- Pas de policies (accès service_role via tRPC)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_source_metadonnee'
  ) THEN
    RAISE EXCEPTION 'No policies should be defined on public.demarche_pcaet_source_metadonnee';
  END IF;
END $$;

ROLLBACK;

