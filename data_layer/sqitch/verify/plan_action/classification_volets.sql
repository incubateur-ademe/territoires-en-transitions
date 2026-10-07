-- Verify tet:plan_action/classification_volets on pg

BEGIN;

DO
$$
    DECLARE
        ancien_nom text;
    BEGIN
        ASSERT (
            SELECT COUNT(*) = 2
            FROM pg_type
            WHERE typname IN ('levier_ges_id', 'volet_categorie')
        ), 'Les types levier_ges_id et volet_categorie doivent exister sous leur nouveau nom';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_type
            WHERE typname IN ('levier_id', 'levier_categorie')
        ), 'Les types levier_id et levier_categorie ne doivent plus exister';

        ASSERT (
            SELECT COUNT(*) = 2
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('fiche_action_volet_ges', 'classification_volets_job')
        ), 'Les tables fiche_action_volet_ges et classification_volets_job doivent exister sous leur nouveau nom';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('fiche_action_levier', 'classification_leviers_job')
        ), 'Les tables fiche_action_levier et classification_leviers_job ne doivent plus exister';

        ASSERT (
            SELECT COUNT(*) = 5
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'fiche_action_volet_ges'
              AND column_name IN ('fiche_id', 'levier_id', 'categorie', 'created_at', 'created_by')
        ), 'Les colonnes de fiche_action_volet_ges ne sont pas renommees : seuls la table et ses types le sont';

        ASSERT (
            SELECT COUNT(*) = 2
            FROM pg_attribute
            WHERE attrelid = 'public.fiche_action_volet_ges'::regclass
              AND (attname = 'levier_id' AND atttypid = 'public.levier_ges_id'::regtype
                OR attname = 'categorie' AND atttypid = 'public.volet_categorie'::regtype)
        ), 'Les colonnes levier_id et categorie doivent porter les types renommes, pas du texte libre';

        SELECT string_agg(conname, ', ' ORDER BY conname) INTO ancien_nom
        FROM pg_constraint
        WHERE conrelid IN ('public.fiche_action_volet_ges'::regclass,
                           'public.classification_volets_job'::regclass)
          AND (conname LIKE 'fiche_action_levier%' OR conname LIKE 'classification_leviers_job%');

        ASSERT ancien_nom IS NULL,
            'Aucune contrainte ne doit garder l''ancien nom, or : ' || coalesce(ancien_nom, '');

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND (indexname LIKE 'fiche_action_levier%' OR indexname LIKE 'classification_leviers_job%')
        ), 'Aucun index ne doit garder l''ancien nom';

        ASSERT (
            SELECT COUNT(*) = 1
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname = 'classification_volets_job_in_flight_unique'
        ), 'L''index unique partiel des jobs en vol doit exister sous son nouveau nom';

        ASSERT (
            SELECT COUNT(*) = 2
            FROM pg_class
            WHERE oid IN ('public.fiche_action_volet_ges'::regclass,
                          'public.classification_volets_job'::regclass)
              AND relrowsecurity
        ), 'La RLS doit rester activee sur les deux tables renommees';

        ASSERT (
            SELECT COUNT(*) = 0
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('fiche_action_volet_ges', 'classification_volets_job')
        ), 'Les deux tables ne doivent porter aucune policy : seul le backend y accede';
    END
$$;

ROLLBACK;
