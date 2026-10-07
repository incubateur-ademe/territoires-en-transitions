-- Deploy tet:utilisateur/utilisateur_identite_oidc to pg
-- requires: utilisateur/schema

BEGIN;

CREATE TABLE public.utilisateur_identite_oidc (
    provider        text        NOT NULL CHECK (provider IN ('proconnect', 'moncompteademe')),
    sub             text        NOT NULL,
    user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email           text        NOT NULL,
    siret           text        NULL,
    idp_id          text        NULL,
    claims          jsonb       NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    last_sign_in_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (provider, sub),
    UNIQUE (user_id, provider)
);

COMMENT ON TABLE public.utilisateur_identite_oidc IS 'Identités OIDC externes (ProConnect puis MonCompteAdeme) liées aux comptes : auth.users.id reste la clé interne, jamais le sub.';
COMMENT ON COLUMN public.utilisateur_identite_oidc.provider IS 'Fournisseur d''identité : proconnect | moncompteademe.';
COMMENT ON COLUMN public.utilisateur_identite_oidc.sub IS 'Subject OIDC : identifiant technique de l''utilisateur chez le provider. Stabilité relative (le sub ProConnect change si l''agent change de FI) : la rotation se fait par upsert sur (user_id, provider).';
COMMENT ON COLUMN public.utilisateur_identite_oidc.user_id IS 'Compte TeT lié. Un seul sub par provider et par compte (UNIQUE(user_id, provider)).';
COMMENT ON COLUMN public.utilisateur_identite_oidc.email IS 'Dernier email vu du provider (peut différer de auth.users.email en cas de collision non synchronisée).';
COMMENT ON COLUMN public.utilisateur_identite_oidc.siret IS 'Claim siret du provider (ProConnect) : sert à la pré-sélection de collectivité.';
COMMENT ON COLUMN public.utilisateur_identite_oidc.idp_id IS 'Identifiant du Fournisseur d''Identité amont (claim idp_id ProConnect).';
COMMENT ON COLUMN public.utilisateur_identite_oidc.claims IS 'Derniers claims bruts vérifiés retournés par le provider.';
COMMENT ON COLUMN public.utilisateur_identite_oidc.last_sign_in_at IS 'Horodatage de la dernière connexion via ce provider.';

-- RLS sans policy : seul service_role accède à la table.
ALTER TABLE public.utilisateur_identite_oidc ENABLE ROW LEVEL SECURITY;

-- `public` est exposé à PostgREST (supabase/config.toml) et Supabase y applique
-- un GRANT par défaut vers anon/authenticated : sans ce REVOKE, la RLS serait
-- l'unique barrière devant les claims OIDC bruts.
REVOKE ALL ON public.utilisateur_identite_oidc FROM anon, authenticated;

COMMIT;
