-- Revert tet:utilisateur/utilisateur_role_backoffice from pg

BEGIN;

DROP TABLE public.utilisateur_role_backoffice;

COMMIT;
