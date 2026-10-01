-- Reserve direct observation writes for the backend and privileged imports.
-- User mutations use the authorized REST/tRPC/PCAET paths, including recalculation.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.indicateur_valeur IN ACCESS EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS private.indicateur_valeur_write_acl (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    owner_name text NOT NULL,
    grants jsonb NOT NULL CHECK (jsonb_typeof(grants) = 'array')
);
REVOKE ALL ON private.indicateur_valeur_write_acl
    FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE private.indicateur_valeur_write_acl ENABLE ROW LEVEL SECURITY;

INSERT INTO private.indicateur_valeur_write_acl (owner_name, grants)
SELECT pg_get_userbyid(relowner), (
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
) FROM pg_class WHERE oid = 'public.indicateur_valeur'::regclass
ON CONFLICT (singleton) DO NOTHING;

-- Do not silently flatten delegated grants or revoke other roles' capabilities.
-- Such installations need an explicit ACL decision before this migration.
DO $$
DECLARE original private.indicateur_valeur_write_acl;
BEGIN
    SELECT * INTO STRICT original FROM private.indicateur_valeur_write_acl;
    IF original.owner_name <> current_user
       OR EXISTS (SELECT 1 FROM jsonb_array_elements(original.grants) grant_entry
                  WHERE grant_entry->>'grantor' <> original.owner_name) THEN
        RAISE EXCEPTION USING ERRCODE = '55000',
            MESSAGE = 'La migration des ACL doit être exécutée par le propriétaire ; les délégations nécessitent un traitement explicite';
    END IF;
END;
$$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.indicateur_valeur FROM PUBLIC, anon, authenticated;

-- A table-level REVOKE does not remove older grants on individual columns.
DO $$
DECLARE column_name text;
BEGIN
    FOR column_name IN
        SELECT attname FROM pg_attribute
        WHERE attrelid = 'public.indicateur_valeur'::regclass
          AND attnum > 0 AND NOT attisdropped
    LOOP
        EXECUTE format(
            'REVOKE INSERT (%1$I), UPDATE (%1$I), REFERENCES (%1$I) '
            'ON public.indicateur_valeur FROM PUBLIC, anon, authenticated',
            column_name
        );
    END LOOP;
END;
$$;

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

COMMENT ON TABLE private.indicateur_valeur_write_acl IS
    'Droits de mutation directs retirés pour imposer les services de valeurs autorisés ; restauration exacte au revert.';
COMMIT;
