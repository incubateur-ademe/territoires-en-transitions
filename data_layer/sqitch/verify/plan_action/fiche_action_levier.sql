-- Verify tet:plan_action/fiche_action_levier on pg

BEGIN;

DO $$
DECLARE
    primary_key_columns text;
    fiche_delete_rule   text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 5
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'fiche_action_levier'
          AND column_name IN ('fiche_id', 'levier_id', 'categorie', 'created_at', 'created_by')
    ), 'La table fiche_action_levier doit contenir les 5 colonnes attendues';

    SELECT string_agg(a.attname, ',' ORDER BY array_position(c.conkey, a.attnum))
    INTO primary_key_columns
    FROM pg_constraint c
             JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.fiche_action_levier'::regclass
      AND c.contype = 'p';

    ASSERT primary_key_columns = 'fiche_id,levier_id,categorie',
        'La cle primaire doit porter sur (fiche_id, levier_id, categorie) : c''est elle qui rend '
            'une reapplication du meme classement idempotente. Trouve : ' || coalesce(primary_key_columns, 'aucune');

    SELECT rc.delete_rule
    INTO fiche_delete_rule
    FROM information_schema.table_constraints tc
             JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
             JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'fiche_action_levier'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'fiche_id';

    ASSERT fiche_delete_rule = 'CASCADE',
        'La suppression d''une fiche doit emporter ses leviers, sinon ils survivent orphelins';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = 'public.fiche_action_levier'::regclass
    ), 'La RLS doit etre activee sur fiche_action_levier';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'fiche_action_levier'
    ), 'Aucune policy ne doit exister : la table n''est alimentee que par le job, en service_role';

    ASSERT (
        SELECT COUNT(*) = 3
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'fiche_action_levier'
          AND column_name IN ('levier_id', 'categorie', 'created_by')
          AND is_nullable = 'NO'
    ), 'levier_id, categorie et created_by doivent etre NOT NULL : c''est ce qui transforme un levier non mappe en echec bruyant plutot qu''en ligne muette';

    ASSERT (
        SELECT COUNT(*) = 2
        FROM pg_attribute
        WHERE attrelid = 'public.fiche_action_levier'::regclass
          AND (attname = 'levier_id' AND atttypid = 'public.levier_id'::regtype
            OR attname = 'categorie' AND atttypid = 'public.levier_categorie'::regtype)
    ), 'Les colonnes levier_id et categorie doivent porter leurs types enum, pas du texte libre';
END
$$;

ROLLBACK;
