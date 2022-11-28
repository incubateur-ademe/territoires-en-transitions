-- Deploy tet:stats/collectivite to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

-- On ne veut pas revert le fix qui resynchronise la feature.

COMMIT;
