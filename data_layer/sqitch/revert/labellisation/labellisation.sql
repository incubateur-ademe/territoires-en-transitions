-- Deploy tet:labellisation/labellisation to pg

BEGIN;

DROP POLICY IF EXISTS allow_read ON labellisation.etoile_meta;

ALTER TABLE labellisation.etoile_meta
  DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA labellisation FROM anon, authenticated, service_role;
REVOKE ALL ON ALL ROUTINES IN SCHEMA labellisation FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA labellisation FROM anon, authenticated, service_role;

REVOKE USAGE ON SCHEMA labellisation FROM anon, authenticated, service_role;

COMMIT;
