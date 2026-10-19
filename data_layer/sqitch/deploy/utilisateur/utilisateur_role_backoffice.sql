-- Deploy tet:utilisateur/utilisateur_role_backoffice to pg
-- requires: utils/auth

BEGIN;

CREATE TABLE public.utilisateur_role_backoffice (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('BACKOFFICE_REPRISE_TEC_LECTURE')),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid DEFAULT auth.uid(),
    PRIMARY KEY (user_id, role)
);

ALTER TABLE public.utilisateur_role_backoffice ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.utilisateur_role_backoffice FROM PUBLIC, anon, authenticated;

COMMIT;
