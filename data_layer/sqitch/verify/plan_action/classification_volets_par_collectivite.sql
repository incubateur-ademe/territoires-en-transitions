-- Verify tet:plan_action/classification_volets_par_collectivite on pg

BEGIN;

DO
$$
    DECLARE
        colonnes_indexees text;
    BEGIN
        ASSERT (
            SELECT COUNT(*) = 0
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'classification_volets_job'
              AND column_name = 'plan_id'
        ), 'La colonne plan_id doit avoir disparu : l''analyse porte sur la collectivite, pas sur un plan';

        SELECT string_agg(a.attname, ',' ORDER BY k.ord) INTO colonnes_indexees
        FROM pg_index i
                 JOIN pg_class c ON c.oid = i.indexrelid
                 CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE c.relname = 'classification_volets_job_in_flight_unique'
          AND i.indrelid = 'public.classification_volets_job'::regclass;

        ASSERT colonnes_indexees = 'collectivite_id,enjeu',
            'L''index des jobs en vol doit porter sur (collectivite_id, enjeu) dans cet ordre, or : '
                || coalesce(colonnes_indexees, 'index absent');

        ASSERT (
            SELECT indisunique AND indpred IS NOT NULL
            FROM pg_index i
                     JOIN pg_class c ON c.oid = i.indexrelid
            WHERE c.relname = 'classification_volets_job_in_flight_unique'
              AND i.indrelid = 'public.classification_volets_job'::regclass
        ), 'L''index doit rester unique et partiel : un job termine ne bloque aucun nouvel enfilement';
    END
$$;

ROLLBACK;
