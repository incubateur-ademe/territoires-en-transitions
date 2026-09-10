-- Verify tet:labellisation/drop_bibliotheque_fichier_views on pg

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.bibliotheque_fichier') IS NOT NULL
        OR to_regclass('labellisation.bibliotheque_fichier_snippet') IS NOT NULL
        OR to_regclass('public.bibliotheque_annexe') IS NOT NULL
        OR to_regclass('public.preuve') IS NOT NULL
        OR to_regclass('public.retool_preuves') IS NOT NULL
    THEN
        RAISE EXCEPTION 'Une vue dérivée de bibliotheque_fichier existe encore';
    END IF;
END $$;

ROLLBACK;
