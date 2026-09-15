-- Verify tet:plan_action/collectivite_volet_ges on pg

BEGIN;

DO
$$
    DECLARE
        contrainte_etape text;
        contrainte_note  text;
        cle_primaire     text;
    BEGIN
        ASSERT (
            SELECT is_nullable = 'NO' AND column_default IS NULL
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'classification_volets_job'
              AND column_name = 'etape'
        ), 'La colonne etape doit etre NOT NULL et sans defaut : chaque enfilement nomme son etape';

        SELECT pg_get_constraintdef(oid) INTO contrainte_etape
        FROM pg_constraint
        WHERE conname = 'classification_volets_job_etape_check'
          AND conrelid = 'public.classification_volets_job'::regclass;

        ASSERT contrainte_etape IS NOT NULL,
            'La contrainte classification_volets_job_etape_check doit exister';

        ASSERT contrainte_etape LIKE '%classification%' AND contrainte_etape LIKE '%mobilisation%',
            'La contrainte doit borner etape aux deux etapes connues, or : ' || contrainte_etape;

        SELECT pg_get_constraintdef(oid) INTO contrainte_note
        FROM pg_constraint
        WHERE conname = 'collectivite_volet_ges_note_check'
          AND conrelid = 'public.collectivite_volet_ges'::regclass;

        ASSERT contrainte_note IS NOT NULL,
            'La contrainte collectivite_volet_ges_note_check doit exister';

        ASSERT contrainte_note LIKE '%0%' AND contrainte_note LIKE '%3%',
            'La note doit etre bornee entre 0 et 3, or : ' || contrainte_note;

        SELECT string_agg(a.attname, ',' ORDER BY k.ord) INTO cle_primaire
        FROM pg_index i
                 CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE i.indrelid = 'public.collectivite_volet_ges'::regclass
          AND i.indisprimary;

        ASSERT cle_primaire = 'collectivite_id,levier_id,categorie',
            'La cle primaire doit porter sur (collectivite_id, levier_id, categorie) dans cet ordre, or : '
                || coalesce(cle_primaire, 'cle absente');

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.collectivite_volet_ges'::regclass
        ), 'La table doit avoir la RLS activee : elle derive du contenu de fiches';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'collectivite_volet_ges'
        ), 'La table ne doit porter aucune policy : seul service_role y accede';
    END
$$;

ROLLBACK;
