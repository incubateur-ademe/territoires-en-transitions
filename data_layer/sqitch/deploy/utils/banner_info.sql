-- Deploy tet:utils/banner_info to pg

BEGIN;

CREATE TABLE public.banner_info (
    id           integer     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    type         text        NOT NULL CHECK (type IN ('info', 'warning', 'error', 'event')),
    info         text        NOT NULL DEFAULT '',
    modified_at  timestamptz NOT NULL DEFAULT now(),
    modified_by  uuid        NULL REFERENCES public.dcp(user_id) ON DELETE SET NULL,
    active       boolean     NOT NULL DEFAULT false
);

COMMENT ON TABLE public.banner_info IS 'Bannière propriétaire affichée dans l''app, éditable par les utilisateurs support en mode super-admin actif. Singleton : exactement une ligne (id=1, contraint par CHECK + PK).';
COMMENT ON COLUMN public.banner_info.id IS 'Toujours 1 — la table est un singleton (CHECK id = 1 + DEFAULT 1). Permet INSERT … ON CONFLICT (id) DO UPDATE atomique.';
COMMENT ON COLUMN public.banner_info.type IS 'Type de bannière (info | warning | error | event). Typage côté TS uniquement (cf. @tet/domain/utils BannerType).';
COMMENT ON COLUMN public.banner_info.info IS 'Contenu HTML de la bannière, déjà assaini côté serveur (DOMPurify) avant insertion.';
COMMENT ON COLUMN public.banner_info.active IS 'Si true, la bannière est affichée par le widget. Le singleton se met à active=false pour désactiver sans perdre le contenu.';

-- RLS enabled with NO policies: only service_role (used by the NestJS backend)
-- can read/write. PostgREST clients with `authenticated` or `anon` JWTs are
-- silently denied. All access goes through tRPC.
ALTER TABLE public.banner_info ENABLE ROW LEVEL SECURITY;

COMMIT;
