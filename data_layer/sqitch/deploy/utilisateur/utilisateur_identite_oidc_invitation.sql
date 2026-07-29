-- Deploy tet:utilisateur/utilisateur_identite_oidc_invitation to pg
-- requires: utilisateur/schema

BEGIN;

CREATE TABLE public.utilisateur_identite_oidc_invitation (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash     text        NOT NULL UNIQUE,
    provider       text        NOT NULL CHECK (provider IN ('proconnect', 'moncompteademe')),
    sub            text        NOT NULL,
    claims         jsonb       NOT NULL,
    email_provider text        NOT NULL,
    initial_mail   text        NOT NULL,
    user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at     timestamptz NOT NULL DEFAULT now(),
    expires_at     timestamptz NOT NULL,
    confirmed_at   timestamptz NULL
);

COMMENT ON TABLE public.utilisateur_identite_oidc_invitation IS 'Invitations à lier une identité OIDC externe à un compte historique, par email de confirmation (fallback « mot de passe oublié » du parcours déclaratif).';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.token_hash IS 'Empreinte sha256 du token envoyé par email : le token brut n''est jamais stocké (usage unique, anti-énumération).';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.provider IS 'Fournisseur d''identité : proconnect | moncompteademe.';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.sub IS 'Subject OIDC de l''identité à lier.';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.claims IS 'Claims vérifiés du provider, figés au moment de l''invitation.';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.email_provider IS 'Email vu du provider au moment de l''invitation.';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.initial_mail IS 'Email du compte historique visé, destinataire de l''email de confirmation.';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.user_id IS 'Compte historique visé par la liaison (auth.users.id reste la clé interne).';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.expires_at IS 'Expiration de l''invitation (24 h après création, contrôlée applicativement à la confirmation).';
COMMENT ON COLUMN public.utilisateur_identite_oidc_invitation.confirmed_at IS 'Horodatage de la confirmation ; NULL tant que l''invitation est pendante.';

-- Une seule invitation pendante par identité : le renvoi remplace la précédente.
CREATE UNIQUE INDEX utilisateur_identite_oidc_invitation_pending_unique
    ON public.utilisateur_identite_oidc_invitation (provider, sub)
    WHERE confirmed_at IS NULL;

-- RLS sans policy : seul service_role accède à la table.
ALTER TABLE public.utilisateur_identite_oidc_invitation ENABLE ROW LEVEL SECURITY;

-- `public` est exposé à PostgREST (supabase/config.toml) et Supabase y applique
-- un GRANT par défaut vers anon/authenticated : sans ce REVOKE, la RLS serait
-- l'unique barrière devant `token_hash`.
REVOKE ALL ON public.utilisateur_identite_oidc_invitation FROM anon, authenticated;

COMMIT;
