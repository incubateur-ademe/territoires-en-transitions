-- Deploy tet:labellisation/labellisation to pg
-- requires: referentiel/contenu
-- requires: collectivite/collectivite
-- requires: utils/auth

BEGIN;

-- Enable access to `etoile_meta`.
-- Code taken from https://supabase.com/docs/guides/api/using-custom-schemas

GRANT USAGE ON SCHEMA labellisation TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA labellisation TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA labellisation TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA labellisation TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA labellisation GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA labellisation GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA labellisation GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


ALTER TABLE labellisation.etoile_meta
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_read
  ON labellisation.etoile_meta
  FOR SELECT
  USING (is_authenticated());

COMMIT;
