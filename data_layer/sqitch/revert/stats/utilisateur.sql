-- Deploy tet:stats/utilisateur to pg
-- requires: utilisateur/droits

BEGIN;

-- On ne veut pas revert le fix qui resynchronise la feature.

COMMIT;
