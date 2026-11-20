-- Deploy tet:utilisateur/invitation_email_pending_index to pg
-- requires: utilisateur/invitation_v2

-- Retrouver les invitations en attente d'une adresse.
--
-- À chaque connexion, le backend reprend les invitations restées en attente
-- pour l'email confirmé du compte (création du compte sans le lien du mail,
-- par ProConnect notamment). L'index est partiel : seules les invitations ni
-- acceptées ni révoquées sont recherchées, et ce sont les moins nombreuses.

BEGIN;

CREATE INDEX invitation_email_pending_idx
    ON utilisateur.invitation (lower(email))
    WHERE accepted_at IS NULL AND active;

COMMENT ON INDEX utilisateur.invitation_email_pending_idx IS 'Reprise des invitations en attente par l''adresse du compte, insensible à la casse.';

COMMIT;
