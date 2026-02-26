-- Deploy tet:utilisateur/drop_list_membres_views to pg
-- requires: utilisateur/test_create_user_sync_dcp

BEGIN;

-- Drop collectivite_membres RPC (replaced by list-membres tRPC service)
DROP FUNCTION IF EXISTS collectivite_membres(integer);

-- Drop member update functions (replaced by mutate-membres tRPC service)
DROP FUNCTION IF EXISTS update_collectivite_membre_niveau_acces(integer, uuid, niveau_acces);
DROP FUNCTION IF EXISTS update_collectivite_membre_details_fonction(integer, uuid, text);
DROP FUNCTION IF EXISTS update_collectivite_membre_fonction(integer, uuid, membre_fonction);
DROP FUNCTION IF EXISTS update_collectivite_membre_champ_intervention(integer, uuid, referentiel[]);
DROP FUNCTION IF EXISTS remove_membre_from_collectivite(integer, text);

COMMIT;
