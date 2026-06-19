-- Bootstrap minimal pour GoTrue self-hosted (supabase/auth) sur Scaleway PG managé.
--
-- Partage de responsabilité avec Terraform :
--   - Le rôle supabase_auth_admin et son privilège DB-level (CONNECT/CREATE)
--     sont gérés par scaleway_rdb_user + scaleway_rdb_privilege dans
--     infra/preprod/main.tf. Sur Scaleway l'admin (tet_admin) n'est pas
--     superuser, n'a pas le grant option sur la DB, et seul l'API Scaleway
--     (qui agit comme _rdb_superadmin) peut accorder ces privilèges.
--   - Ce script prend le relais pour ce que la TF ne sait pas faire :
--     l'extension pgcrypto et la création du schéma auth dont
--     supabase_auth_admin est propriétaire.
--
-- Le schéma auth.* lui-même (tables users, sessions, etc.) sera créé par les
-- migrations embarquées de GoTrue au premier démarrage du conteneur
-- (GOTRUE_DB_AUTOMIGRATE=true).
--
-- À exécuter via la cible Makefile dédiée :
--
--   cd infra/preprod && make bootstrap-auth-sql
--
-- Sortie attendue : BEGIN / CREATE EXTENSION / DO / CREATE SCHEMA / COMMIT,
-- aucun WARNING.

\set ON_ERROR_STOP on
BEGIN;

-- gen_random_uuid() est utilisé par les migrations GoTrue à partir de
-- 20231117164230_add_id_pkey_identities (puis OAuth providers, passkeys).
-- En PG 13+ la fonction est aussi exposée par le core mais on garde
-- pgcrypto pour rester aligné sur l'image upstream.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- L'admin Scaleway n'est pas superuser : il ne peut pas créer un schéma
-- AUTHORIZATION supabase_auth_admin sans être membre du rôle. tet_admin
-- hérite d'admin option sur les rôles user-created via son appartenance
-- à _rdb_admin, ce qui rend la grant possible.
DO $$ BEGIN
  EXECUTE format('GRANT supabase_auth_admin TO %I', current_user);
END $$;

-- Schéma auth vide — peuplé par les migrations GoTrue au premier démarrage.
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;

-- Rôle "postgres" placeholder NOLOGIN. Plusieurs migrations Supabase auth
-- (notamment 20240612123726_enable_rls_update_grants) font des
-- GRANT ... TO postgres en dur — le nom de rôle n'est pas templaté. Sur
-- Scaleway l'admin s'appelle tet_admin et "postgres" est interdit comme
-- nom d'admin RDB, on crée donc un rôle factice NOLOGIN pour que les grants
-- aboutissent. Aucun risque : sans LOGIN ni privilège DB, personne ne peut
-- s'en servir, le "with grant option" reste dormant.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres NOLOGIN;
  END IF;
END $$;

COMMIT;
