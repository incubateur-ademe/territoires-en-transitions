-- Verify tet:plan_action/classification_volets_enjeu on pg

BEGIN;

DO
$$
    DECLARE
        colonnes_indexees text;
    BEGIN
        ASSERT (
            SELECT COUNT(*) = 1
            FROM pg_enum e
                     JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'enjeu'
              AND e.enumlabel = 'ges'
        ), 'Le type enjeu doit declarer la valeur ges posee par ce change';

        ASSERT (
            SELECT is_nullable = 'NO' AND column_default IS NULL
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'classification_volets_job'
              AND column_name = 'enjeu'
        ), 'La colonne enjeu doit etre NOT NULL et sans defaut : chaque enfilement nomme son enjeu';

        ASSERT (
            SELECT atttypid = 'public.enjeu'::regtype
            FROM pg_attribute
            WHERE attrelid = 'public.classification_volets_job'::regclass
              AND attname = 'enjeu'
        ), 'La colonne enjeu doit porter le type enum, pas du texte libre';

        SELECT string_agg(a.attname, ',' ORDER BY k.ord) INTO colonnes_indexees
        FROM pg_index i
                 JOIN pg_class c ON c.oid = i.indexrelid
                 CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE c.relname = 'classification_volets_job_in_flight_unique';

        ASSERT colonnes_indexees = 'plan_id,enjeu',
            'L''index des jobs en vol doit porter sur (plan_id, enjeu) dans cet ordre, or : '
                || coalesce(colonnes_indexees, 'index absent');

        ASSERT (
            SELECT indisunique AND indpred IS NOT NULL
            FROM pg_index i
                     JOIN pg_class c ON c.oid = i.indexrelid
            WHERE c.relname = 'classification_volets_job_in_flight_unique'
        ), 'L''index doit rester unique et partiel : un job termine ne bloque aucun nouvel enfilement';
    END
$$;

ROLLBACK;
