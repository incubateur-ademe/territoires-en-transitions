-- Verify tet:plan_action/fiche_action_secteur_attribution on pg

BEGIN;

DO
$$
    DECLARE
        primary_key_columns text;
        origine_constraint  text;
    BEGIN
        ASSERT (
            SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
            FROM pg_enum
            WHERE enumtypid = 'public.secteur_reglementaire'::regtype
        ) = ARRAY [
            'residentiel', 'tertiaire', 'transport_routier', 'autres_transports',
            'agriculture', 'dechets', 'industrie_hors_branche_energie', 'branche_energie'
        ], 'L enum secteur_reglementaire doit porter les 8 secteurs R. 229-52';

        SELECT string_agg(a.attname, ',') INTO primary_key_columns
        FROM pg_index i
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
        WHERE i.indrelid = 'public.fiche_action_secteur_attribution'::regclass
          AND i.indisprimary;

        ASSERT primary_key_columns = 'fiche_id',
            'La cle primaire doit porter sur fiche_id seul, or : ' || coalesce(primary_key_columns, 'cle absente');

        ASSERT (
            SELECT confdeltype = 'c'
            FROM pg_constraint
            WHERE conrelid = 'public.fiche_action_secteur_attribution'::regclass
              AND confrelid = 'public.fiche_action'::regclass
        ), 'La suppression physique d une fiche doit supprimer son attribution';

        ASSERT (
            SELECT is_nullable = 'NO' AND udt_name = '_secteur_reglementaire'
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'fiche_action_secteur_attribution'
              AND column_name = 'secteurs'
        ), 'La colonne secteurs doit etre un tableau de secteur_reglementaire non nul';

        SELECT pg_get_constraintdef(oid) INTO origine_constraint
        FROM pg_constraint
        WHERE conname = 'fiche_action_secteur_attribution_origine_check'
          AND conrelid = 'public.fiche_action_secteur_attribution'::regclass;

        ASSERT origine_constraint LIKE '%automatique%'
                   AND origine_constraint LIKE '%manuelle%'
                   AND origine_constraint LIKE '%indisponible%',
            'L origine doit etre bornee a automatique, manuelle et indisponible, or : ' || coalesce(origine_constraint, 'contrainte absente');

        ASSERT (
            SELECT relrowsecurity
            FROM pg_class
            WHERE oid = 'public.fiche_action_secteur_attribution'::regclass
        ), 'La table doit avoir la RLS activee';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'fiche_action_secteur_attribution'
        ), 'La table ne doit porter aucune policy : seul le backend y accede';

        ASSERT NOT has_table_privilege('authenticated', 'public.fiche_action_secteur_attribution', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE'),
            'authenticated ne doit avoir aucun droit sur fiche_action_secteur_attribution : seul le backend y accede';
    END
$$;

ROLLBACK;
