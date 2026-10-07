-- Revert tet:utilisateur/utilisateur_identite_oidc_invitation from pg

BEGIN;

DROP TABLE IF EXISTS public.utilisateur_identite_oidc_invitation CASCADE;

COMMIT;
