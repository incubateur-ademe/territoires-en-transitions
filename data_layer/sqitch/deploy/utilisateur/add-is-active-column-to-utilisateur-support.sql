-- Deploy tet:utilisateur/add-is-active-column-to-utilisateur-support to pg

BEGIN;

ALTER TABLE utilisateur_support
ADD COLUMN is_support_mode_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN utilisateur_support.is_support_mode_enabled IS 'Indique si le mode support est actif pour cet utilisateur. Le mode support doit être activé pour que les permissions admin-like soient appliquées.';

COMMIT;
