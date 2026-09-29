-- Verify tet:indicateur/correct-dates-historiques on pg

BEGIN;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle = 'ISO, YMD';
SET LOCAL extra_float_digits = 3;
-- Refuse une vue filtrée par RLS ; ce réglage ne contourne pas les politiques.
SET LOCAL row_security = off;
-- L'archive prouve l'opération ponctuelle. Les observations vivantes peuvent
-- ensuite évoluer, être supprimées ou recevoir de nouvelles colonnes.
DO $verify$
BEGIN
    IF EXISTS (
        WITH expected(id, indicateur_id, collectivite_id, date_avant, date_apres) AS (VALUES
        (24464, 135, 1466, DATE '0001-01-01 BC', DATE '2024-01-01'),
        (27353, 333, 3830, DATE '0001-01-01 BC', NULL::date),
        (287811340, 45906, 5596, DATE '20225-01-01', NULL::date),
        (11979621, 31816, 2181, DATE '202501-01-01', NULL::date),
        (11979622, 31816, 2181, DATE '202502-01-01', NULL::date),
        (11979623, 31816, 2181, DATE '202503-01-01', NULL::date),
        (11979624, 31816, 2181, DATE '202504-01-01', DATE '2025-01-01'),
        (12374016, 32392, 2181, DATE '202511-01-01', NULL::date),
        (12374017, 32392, 2181, DATE '202512-01-01', DATE '2025-01-01')
        )
        SELECT 1 FROM private.indicateur_valeur_date_repair a
        LEFT JOIN expected ON expected.id = a.valeur_id
        WHERE expected.id IS NULL
           OR (a.avant->>'id')::integer IS DISTINCT FROM expected.id
           OR (a.avant->>'indicateur_id')::integer IS DISTINCT FROM expected.indicateur_id
           OR (a.avant->>'collectivite_id')::integer IS DISTINCT FROM expected.collectivite_id
           OR (a.avant->>'date_valeur')::date IS DISTINCT FROM expected.date_avant
           OR a.avant->>'metadonnee_id' IS NOT NULL
           OR (expected.date_apres IS NULL AND a.apres IS NOT NULL)
           OR (expected.date_apres IS NOT NULL AND (
                a.apres IS NULL
                OR (a.apres->>'date_valeur')::date IS DISTINCT FROM expected.date_apres
                OR (a.apres - ARRAY['date_valeur','modified_at','modified_by'])
                    IS DISTINCT FROM (a.avant - ARRAY['date_valeur','modified_at','modified_by'])
           ))
        UNION ALL
        SELECT 1 FROM expected
        JOIN public.indicateur_valeur v ON v.id = expected.id
            AND v.indicateur_id = expected.indicateur_id
            AND v.collectivite_id = expected.collectivite_id
            AND v.metadonnee_id IS NULL
            AND v.date_valeur = expected.date_avant
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'La réparation ou son archive ne correspond pas aux décisions approuvées';
    END IF;
END;
$verify$;
ROLLBACK;
