-- Verify tet:utilisateur/utilisateur_identite_oidc on pg

BEGIN;

DO $$
DECLARE
    pk_columns     text;
    unique_columns text;
    provider_check text;
    fk_user        text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 9
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateur_identite_oidc'
          AND column_name IN (
              'provider', 'sub', 'user_id', 'email', 'siret',
              'idp_id', 'claims', 'created_at', 'last_sign_in_at'
          )
    ), 'La table utilisateur_identite_oidc doit contenir les 9 colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 3
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateur_identite_oidc'
          AND column_name IN ('siret', 'idp_id', 'claims')
          AND is_nullable = 'YES'
    ), 'Les colonnes siret, idp_id et claims doivent être NULLABLE';

    ASSERT (
        SELECT COUNT(*) = 6
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateur_identite_oidc'
          AND is_nullable = 'NO'
    ), 'Toutes les colonnes sauf siret, idp_id et claims doivent être NOT NULL';

    SELECT string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position)
    INTO pk_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'utilisateur_identite_oidc'
      AND tc.constraint_type = 'PRIMARY KEY';

    ASSERT pk_columns = 'provider,sub',
        'La clé primaire doit être composite (provider, sub)';

    SELECT string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position)
    INTO unique_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'utilisateur_identite_oidc'
      AND tc.constraint_type = 'UNIQUE';

    ASSERT unique_columns = 'user_id,provider',
        'La contrainte UNIQUE(user_id, provider) doit exister';

    SELECT cc.check_clause INTO provider_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'utilisateur_identite_oidc'
      AND ccu.column_name = 'provider'
      AND cc.check_clause LIKE '%proconnect%'
    LIMIT 1;

    ASSERT provider_check IS NOT NULL,
        'La colonne provider doit avoir une contrainte CHECK';
    ASSERT provider_check LIKE '%''proconnect''%'
        AND provider_check LIKE '%''moncompteademe''%',
        'La contrainte CHECK sur provider doit autoriser exactement proconnect|moncompteademe';

    SELECT rc.delete_rule INTO fk_user
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'utilisateur_identite_oidc'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
    LIMIT 1;

    ASSERT fk_user = 'CASCADE',
        'La FK user_id doit avoir delete_rule = CASCADE';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'utilisateur_identite_oidc'
    ), 'RLS doit être activée sur utilisateur_identite_oidc';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'utilisateur_identite_oidc'
    ), 'utilisateur_identite_oidc ne doit avoir aucune policy (RLS deny-by-default, accès service_role uniquement)';
    -- `public` est exposé à PostgREST : le REVOKE du deploy est la barrière
    -- devant la RLS, on vérifie qu'il tient.
    ASSERT NOT has_table_privilege('anon', 'public.utilisateur_identite_oidc', 'SELECT'),
        'utilisateur_identite_oidc ne doit pas être lisible par anon';
    ASSERT NOT has_table_privilege('authenticated', 'public.utilisateur_identite_oidc', 'SELECT'),
        'utilisateur_identite_oidc ne doit pas être lisible par authenticated';
END $$;

ROLLBACK;
