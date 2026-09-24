-- Verify tet:plan_action/fiche_action_analysis on pg

BEGIN;

DO
$$
    DECLARE
        contrainte_statut text;
        cle_primaire      text;
    BEGIN
        SELECT pg_get_constraintdef(oid) INTO contrainte_statut
        FROM pg_constraint
        WHERE conname = 'fiche_action_analysis_status_check'
          AND conrelid = 'public.fiche_action_analysis'::regclass;

        ASSERT contrainte_statut LIKE '%processed%'
                   AND contrainte_statut LIKE '%stale%'
                   AND contrainte_statut LIKE '%failed%',
            'Le statut doit etre borne a processed, stale et failed, or : ' || coalesce(contrainte_statut, 'contrainte absente');

        SELECT string_agg(a.attname, ',') INTO cle_primaire
        FROM pg_index i
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
        WHERE i.indrelid = 'public.fiche_action_analysis'::regclass
          AND i.indisprimary;

        ASSERT cle_primaire = 'fiche_id',
            'La cle primaire doit porter sur fiche_id seul, or : ' || coalesce(cle_primaire, 'cle absente');

        ASSERT (
            SELECT array_agg(conname::text ORDER BY conname::text)
                       @> ARRAY [
                           'fiche_action_analysis_fingerprint_check',
                           'fiche_action_analysis_processed_fingerprint_check',
                           'fiche_action_analysis_retry_count_check',
                           'fiche_action_analysis_status_check'
                       ]
            FROM pg_constraint
            WHERE conrelid = 'public.fiche_action_analysis'::regclass
              AND contype = 'c'
        ), 'Les contraintes de statut, d''empreinte et de compteur doivent exister';

        ASSERT (
            SELECT COUNT(*) = 1
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'fiche_action_analysis'
              AND indexname = 'fiche_action_analysis_collectivite_id_idx'
              AND indexdef LIKE '%(collectivite_id)%'
        ), 'L''index sur collectivite_id doit exister';

        ASSERT (
            SELECT confdeltype = 'c'
            FROM pg_constraint
            WHERE conrelid = 'public.fiche_action_analysis'::regclass
              AND confrelid = 'public.fiche_action'::regclass
        ), 'La suppression physique d''une fiche doit supprimer son statut';

        ASSERT (
            SELECT is_nullable = 'YES'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'fiche_action_analysis'
              AND column_name = 'fingerprint'
        ), 'L''empreinte doit etre nullable : une fiche jamais classee n''en a pas';

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.fiche_action_analysis'::regclass
        ), 'La table doit avoir la RLS activee : elle derive du contenu de fiches';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'fiche_action_analysis'
        ), 'La table ne doit porter aucune policy : seul service_role y accede';
    END
$$;

ROLLBACK;
