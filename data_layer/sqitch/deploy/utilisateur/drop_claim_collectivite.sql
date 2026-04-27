-- Deploy tet:utilisateur/drop_claim_collectivite to pg
-- Les fonctions claim_collectivite sont remplacées par l'appel tRPC collectivites.membres.join

BEGIN;

drop function if exists public.claim_collectivite(integer, membre_fonction, text, referentiel[], boolean);
drop function if exists public.claim_collectivite(integer);

COMMIT;
