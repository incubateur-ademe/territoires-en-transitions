-- Verify tet:site/drop_postgrest_relations on pg

BEGIN;

DO $$
BEGIN
    IF EXISTS(SELECT FROM pg_proc p JOIN pg_type t ON t.oid = p.proargtypes[0]
              WHERE p.pronargs = 1
                AND t.typname IN ('site_labellisation', 'site_region'))
    THEN
        RAISE EXCEPTION 'Une colonne calculée PostgREST sur site_labellisation ou site_region existe encore';
    END IF;

    IF to_regclass('public.site_region') IS NOT NULL
    THEN
        RAISE EXCEPTION 'La vue site_region existe encore';
    END IF;
END $$;

-- Lue par le backend : doit rester.
select collectivite_id from site_labellisation where false;

ROLLBACK;
