-- Verify tet:utilisateur/utilisateur_identite_oidc_invitation on pg

BEGIN;

DO $$
DECLARE
    provider_check  text;
    fk_user         text;
    index_predicate text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 11
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateur_identite_oidc_invitation'
          AND column_name IN (
              'id', 'token_hash', 'provider', 'sub', 'claims',
              'email_provider', 'initial_mail', 'user_id',
              'created_at', 'expires_at', 'confirmed_at'
          )
    ), 'La table utilisateur_identite_oidc_invitation doit contenir les 11 colonnes attendues';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateur_identite_oidc_invitation'
          AND column_name = 'confirmed_at'
          AND is_nullable = 'YES'
    ), 'La colonne confirmed_at doit être NULLABLE';

    ASSERT (
        SELECT COUNT(*) = 10
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'utilisateur_identite_oidc_invitation'
          AND is_nullable = 'NO'
    ), 'Toutes les colonnes sauf confirmed_at doivent être NOT NULL';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            USING (constraint_schema, constraint_name)
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'utilisateur_identite_oidc_invitation'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name = 'token_hash'
    ), 'La contrainte UNIQUE(token_hash) doit exister';

    SELECT cc.check_clause INTO provider_check
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
        ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name = 'utilisateur_identite_oidc_invitation'
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
      AND tc.table_name = 'utilisateur_identite_oidc_invitation'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
    LIMIT 1;

    ASSERT fk_user = 'CASCADE',
        'La FK user_id doit avoir delete_rule = CASCADE';

    SELECT pg_get_expr(i.indpred, i.indrelid) INTO index_predicate
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'utilisateur_identite_oidc_invitation_pending_unique';

    ASSERT index_predicate IS NOT NULL,
        'L''index unique partiel utilisateur_identite_oidc_invitation_pending_unique doit exister';
    ASSERT index_predicate LIKE '%confirmed_at IS NULL%',
        'L''index partiel doit être restreint aux demandes pendantes (confirmed_at IS NULL)';
    ASSERT (
        SELECT i.indisunique
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'utilisateur_identite_oidc_invitation_pending_unique'
    ), 'L''index utilisateur_identite_oidc_invitation_pending_unique doit être UNIQUE';

    ASSERT (
        SELECT relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'utilisateur_identite_oidc_invitation'
    ), 'RLS doit être activée sur utilisateur_identite_oidc_invitation';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'utilisateur_identite_oidc_invitation'
    ), 'utilisateur_identite_oidc_invitation ne doit avoir aucune policy (RLS deny-by-default, accès service_role uniquement)';
    -- `public` est exposé à PostgREST : le REVOKE du deploy est la barrière
    -- devant la RLS, on vérifie qu'il tient.
    ASSERT NOT has_table_privilege('anon', 'public.utilisateur_identite_oidc_invitation', 'SELECT'),
        'utilisateur_identite_oidc_invitation ne doit pas être lisible par anon';
    ASSERT NOT has_table_privilege('authenticated', 'public.utilisateur_identite_oidc_invitation', 'SELECT'),
        'utilisateur_identite_oidc_invitation ne doit pas être lisible par authenticated';
END $$;

ROLLBACK;
