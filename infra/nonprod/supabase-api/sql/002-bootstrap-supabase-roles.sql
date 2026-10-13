-- Rôles Supabase de requête (anon, authenticated, service_role) sur Scaleway PG
-- managé. À exécuter AVANT la restauration du dump Supabase : ses GRANT et
-- ses politiques RLS y font référence, et pg_dump n'exporte pas les rôles.
--
-- Sur Supabase Cloud, ces rôles préexistent et service_role porte BYPASSRLS.
-- Ici, l'admin Scaleway (tet_admin) n'est pas superuser : en PG 15, il peut
-- créer des rôles (CREATEROLE) mais pas leur donner BYPASSRLS. service_role
-- est donc un rôle ordinaire ; les politiques qui compensent sont posées sur
-- le schéma storage par 003-bootstrap-storage.sql.
--
-- Storage API change de rôle à chaque requête (set_config('role', …)) selon le
-- claim role du JWT : son utilisateur de connexion, supabase_storage_admin
-- (créé par Terraform, scaleway_rdb_user), doit donc être membre des trois.
--
-- Idempotent. À exécuter via :
--
--   cd infra/nonprod && make bootstrap-supabase-roles-sql

\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      -- NOINHERIT : comme sur Supabase, ces rôles n'héritent de rien ; les
      -- droits leur sont accordés explicitement.
      EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT', r);
    END IF;
  END LOOP;
END $$;

-- Storage API bascule vers ces rôles par SET ROLE : il faut en être membre.
GRANT anon, authenticated, service_role TO supabase_storage_admin;

COMMIT;
