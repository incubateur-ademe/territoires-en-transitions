BEGIN;
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
BEGIN
    IF (SELECT count(*) FROM private.indicateur_valeur_write_acl) <> 1
       OR NOT (SELECT relrowsecurity FROM pg_class
               WHERE oid = 'private.indicateur_valeur_write_acl'::regclass)
       OR has_table_privilege('anon', 'private.indicateur_valeur_write_acl', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
       OR has_table_privilege('authenticated', 'private.indicateur_valeur_write_acl', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
       OR has_table_privilege('service_role', 'private.indicateur_valeur_write_acl', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'L archive ACL doit rester privée et complète';
    END IF;
END;
$$;
ROLLBACK;
