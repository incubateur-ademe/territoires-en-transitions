-- Deploy tet:utilisateur/dcp_drop_accepter_cgu to pg
-- La fonction accepter_cgu est remplacée par l'appel tRPC users.users.acceptCgu

BEGIN;

drop function if exists accepter_cgu();

COMMIT;
