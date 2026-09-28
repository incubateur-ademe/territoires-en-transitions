-- Deploy tet:indicateur/indicateur_vue to pg
-- requires: collectivite/collectivite
-- requires: utils/auth

BEGIN;

CREATE TABLE public.indicateur_vue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collectivite_id integer NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    nom varchar(100) NOT NULL CHECK (length(trim(nom)) > 0),
    filtres jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    modified_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    modified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX indicateur_vue_collectivite_created_at_id_idx
    ON public.indicateur_vue (collectivite_id, created_at, id);

-- Les permissions métier sont vérifiées par le backend. Aucune policy client.
ALTER TABLE public.indicateur_vue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.indicateur_vue FROM PUBLIC, anon, authenticated;

COMMIT;
