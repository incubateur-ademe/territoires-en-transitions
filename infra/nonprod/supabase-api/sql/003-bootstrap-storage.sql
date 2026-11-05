-- Prépare le schéma storage pour Storage API self-hostée (supabase/storage-api)
-- sur Scaleway PG managé. À exécuter APRÈS la restauration du dump Supabase et
-- après 002-bootstrap-supabase-roles.sql, avant le premier démarrage de Storage.
--
-- Storage API tourne avec DB_INSTALL_ROLES=false : ses migrations ne créent
-- alors aucun rôle et n'accordent rien à anon / authenticated / service_role.
-- Ce script fait ce travail à leur place :
--
--   1. supabase_storage_admin devient propriétaire du schéma storage et de
--      tout ce qu'il contient. Le dump est restauré avec --no-owner, donc au
--      nom de tet_admin ; or les migrations suivantes de Storage (ALTER, CREATE
--      OR REPLACE FUNCTION) tournent sous supabase_storage_admin.
--   2. Droits des trois rôles de requête, présents et futurs.
--   3. Politiques RLS « service_role voit tout » : sur Supabase, service_role
--      contourne la RLS par l'attribut BYPASSRLS, qu'on ne peut pas accorder
--      ici (cf. 002). Sans elles, la clé service_role ne verrait aucun objet.
--
-- Idempotent : peut être rejoué après chaque montée de version de Storage API
-- qui ajoute des tables. À exécuter via :
--
--   cd infra/nonprod && make bootstrap-storage-sql

\set ON_ERROR_STOP on
BEGIN;

-- tet_admin doit être membre de supabase_storage_admin pour lui transférer
-- des objets et régler ses privilèges par défaut.
DO $$ BEGIN
  EXECUTE format('GRANT supabase_storage_admin TO %I', current_user);
END $$;

CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
ALTER SCHEMA storage OWNER TO supabase_storage_admin;

-- 1. Propriété de tout le contenu du schéma.
DO $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT format('ALTER TABLE storage.%I OWNER TO supabase_storage_admin', c.relname) AS ddl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
      AND pg_get_userbyid(c.relowner) <> 'supabase_storage_admin'
    UNION ALL
    SELECT format('ALTER SEQUENCE storage.%I OWNER TO supabase_storage_admin', c.relname)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage'
      AND c.relkind = 'S'
      -- Une séquence liée à une colonne suit le propriétaire de sa table.
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'a')
      AND pg_get_userbyid(c.relowner) <> 'supabase_storage_admin'
    UNION ALL
    SELECT format('ALTER %s storage.%I(%s) OWNER TO supabase_storage_admin',
                  CASE p.prokind WHEN 'p' THEN 'PROCEDURE' ELSE 'FUNCTION' END,
                  p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'storage'
      AND pg_get_userbyid(p.proowner) <> 'supabase_storage_admin'
    UNION ALL
    SELECT format('ALTER TYPE storage.%I OWNER TO supabase_storage_admin', t.typname)
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'storage'
      AND t.typtype IN ('e', 'c', 'd')
      -- Les types composites implicites d'une table suivent la table.
      AND NOT (t.typtype = 'c' AND EXISTS (
        SELECT 1 FROM pg_class c WHERE c.oid = t.typrelid AND c.relkind <> 'c'))
      AND pg_get_userbyid(t.typowner) <> 'supabase_storage_admin'
  LOOP
    EXECUTE obj.ddl;
  END LOOP;
END $$;

-- 2. Droits des rôles de requête, calqués sur ce que la migration
--    0002-storage-schema accorde quand elle installe les rôles elle-même.
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 3. service_role voit et modifie tout, sur chaque table storage soumise à la
--    RLS (objects, buckets, migrations, s3_multipart_uploads[_parts], et les
--    suivantes). Les politiques existantes pour anon et authenticated, venues
--    du dump, ne sont pas touchées.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = t.relname
        AND policyname = 'tet_service_role_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY tet_service_role_all ON storage.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t.relname);
    END IF;
  END LOOP;
END $$;

COMMIT;
