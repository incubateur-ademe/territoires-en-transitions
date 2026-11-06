-- Deploy tet:utilisateur/add-programme-tete-column-to-utilisateur-support to pg

BEGIN;

ALTER TABLE utilisateur_support
ADD COLUMN has_role_tete_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN utilisateur_support.has_role_tete_admin IS 'Donne accès à l''administration des audits, labellisations et COT (équipe du programme TETE), sans les droits super-admin.';

COMMIT;
