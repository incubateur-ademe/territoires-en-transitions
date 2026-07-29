-- Revert tet:utilisateur/utilisateur_identite_oidc from pg

BEGIN;

DROP TABLE IF EXISTS public.utilisateur_identite_oidc CASCADE;

COMMIT;
