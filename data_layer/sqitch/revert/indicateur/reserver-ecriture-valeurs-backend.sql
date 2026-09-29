BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.indicateur_valeur IN ACCESS EXCLUSIVE MODE;

-- Refuse to discard a subsequent authorization change during rollback.
DO $$
DECLARE role_name text;
BEGIN
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF has_table_privilege(role_name, 'public.indicateur_valeur',
                'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
           OR has_any_column_privilege(role_name, 'public.indicateur_valeur',
                'INSERT, UPDATE, REFERENCES') THEN
            RAISE EXCEPTION USING ERRCODE = '42501',
                MESSAGE = format('Le rôle %s conserve un droit de mutation, éventuellement hérité, sur indicateur_valeur', role_name);
        END IF;
        IF NOT has_table_privilege(role_name, 'public.indicateur_valeur', 'SELECT') THEN
            RAISE EXCEPTION USING ERRCODE = '42501',
                MESSAGE = format('Le droit de lecture de %s doit être conservé', role_name);
        END IF;
    END LOOP;
    IF NOT has_table_privilege('service_role', 'public.indicateur_valeur', 'SELECT')
       OR NOT has_table_privilege('service_role', 'public.indicateur_valeur', 'INSERT')
       OR NOT has_table_privilege('service_role', 'public.indicateur_valeur', 'UPDATE')
       OR NOT has_table_privilege('service_role', 'public.indicateur_valeur', 'DELETE') THEN
        RAISE EXCEPTION USING ERRCODE = '42501',
            MESSAGE = 'Les imports service_role doivent conserver leurs droits sur indicateur_valeur';
    END IF;
END;
$$;

DO $$
DECLARE
    original private.indicateur_valeur_write_acl;
    grant_entry jsonb;
    privilege_sql text;
    grantee_sql text;
    current_grants jsonb;
BEGIN
    SELECT * INTO STRICT original FROM private.indicateur_valeur_write_acl;
    IF original.owner_name <> current_user OR original.owner_name <> (
        SELECT pg_get_userbyid(relowner) FROM pg_class
        WHERE oid = 'public.indicateur_valeur'::regclass
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '55000',
            MESSAGE = 'Le propriétaire doit restaurer les ACL originales d indicateur_valeur';
    END IF;
    FOR grant_entry IN SELECT * FROM jsonb_array_elements(original.grants) LOOP
        IF grant_entry->>'privilege' NOT IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
           OR grant_entry->>'role' NOT IN ('PUBLIC', 'anon', 'authenticated')
           OR grant_entry->>'grantor' <> original.owner_name THEN
            RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Archive ACL incohérente';
        END IF;
        privilege_sql := grant_entry->>'privilege';
        IF grant_entry->>'column' IS NOT NULL THEN
            privilege_sql := format('%s (%I)', privilege_sql, grant_entry->>'column');
        END IF;
        grantee_sql := CASE WHEN grant_entry->>'role' = 'PUBLIC' THEN 'PUBLIC'
                            ELSE quote_ident(grant_entry->>'role') END;
        EXECUTE format('GRANT %s ON public.indicateur_valeur TO %s%s',
            privilege_sql, grantee_sql,
            CASE WHEN (grant_entry->>'grantable')::boolean THEN ' WITH GRANT OPTION' ELSE '' END);
    END LOOP;
    current_grants := (
WITH grants AS (
    SELECT acl.grantor, acl.grantee, acl.privilege_type, acl.is_grantable,
           NULL::text AS column_name
    FROM pg_class relation
    CROSS JOIN LATERAL aclexplode(relation.relacl) acl
    WHERE relation.oid = 'public.indicateur_valeur'::regclass
    UNION ALL
    SELECT acl.grantor, acl.grantee, acl.privilege_type, acl.is_grantable,
           attribute.attname::text
    FROM pg_attribute attribute
    CROSS JOIN LATERAL aclexplode(attribute.attacl) acl
    WHERE attribute.attrelid = 'public.indicateur_valeur'::regclass
      AND attribute.attnum > 0 AND NOT attribute.attisdropped
), affected AS (
    SELECT *, CASE WHEN grantee = 0 THEN 'PUBLIC'
                   ELSE pg_get_userbyid(grantee)::text END AS role_name
    FROM grants
    WHERE privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
      AND (grantee = 0 OR grantee IN (
          SELECT oid FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
      ))
)
SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'role', role_name, 'column', column_name,
    'privilege', privilege_type, 'grantable', is_grantable,
    'grantor', pg_get_userbyid(grantor)::text
) ORDER BY role_name, column_name NULLS FIRST, privilege_type), '[]'::jsonb)
FROM affected
    );
    IF current_grants IS DISTINCT FROM original.grants THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'Les ACL originales n ont pas été restaurées exactement';
    END IF;
END;
$$;
DROP TABLE private.indicateur_valeur_write_acl;
COMMIT;
