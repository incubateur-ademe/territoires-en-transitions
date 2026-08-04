-- Deploy tet:demarche/demarche to pg

BEGIN;

-- Table unique pour tous les types de démarches (héritage par discriminant) :
-- le type concret est porté par la colonne `type`, les règles de cycle de vie
-- par le workflow du domaine correspondant.
CREATE TABLE public.demarche (
    id                 serial      PRIMARY KEY,
    collectivite_id    integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    type               text        NOT NULL CHECK (type IN ('pcaet')),
    titre              text        NOT NULL,
    description        text        NOT NULL DEFAULT '',
    -- Les statuts valides dépendent du type de démarche : étendre ce CHECK
    -- (OR type = '…' AND status IN (…)) à chaque nouveau type.
    status             text        NOT NULL DEFAULT 'en_elaboration' CHECK (
                           type = 'pcaet' AND status IN (
                           'en_elaboration', 'transmis_pour_avis', 'adopte', 'archive')),
    publication_status text        NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published')),
    obligation         text        NOT NULL DEFAULT 'obligatoire' CHECK (obligation IN ('volontaire', 'obligatoire')),
    launched_at        timestamptz NULL,
    published_at       timestamptz NULL,
    transmitted_at     timestamptz NULL,
    avis_deadline_at   timestamptz NULL,
    plan_action_id     integer     NULL REFERENCES public.axe(id) ON DELETE SET NULL,
    created_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid        NULL REFERENCES auth.users(id),
    modified_at        timestamptz NOT NULL DEFAULT now(),
    modified_by        uuid        NULL
);

COMMENT ON TABLE public.demarche IS
    'Démarche réglementaire d''une collectivité (dossier + processus de validation). Table unique pour tous les types (héritage par discriminant) — premier type : pcaet (migration depuis territoires-climat.ademe.fr).';
COMMENT ON COLUMN public.demarche.type IS
    'Discriminant du type de démarche (pcaet, …) : détermine le workflow et les statuts applicables.';
COMMENT ON COLUMN public.demarche.status IS
    'Cycle de vie du dépôt, propre au type. PCAET : en_elaboration → transmis_pour_avis (préfet de région, conseil régional, MRAe) → adopte (mise en œuvre 6 ans) → archive. Transitions gérées par le domaine demarches.';
COMMENT ON COLUMN public.demarche.publication_status IS
    'Statut de publication visible dans l''interface : draft | published.';
COMMENT ON COLUMN public.demarche.obligation IS
    'Collectivité obligée (art. L229-26 du code de l''environnement) ou volontaire.';
COMMENT ON COLUMN public.demarche.launched_at IS
    'Date de lancement de la démarche saisie par la collectivité.';
COMMENT ON COLUMN public.demarche.transmitted_at IS
    'Dernière transmission pour avis (conservée si l''élaboration est reprise — NULL = jamais transmise, condition de suppression).';
COMMENT ON COLUMN public.demarche.avis_deadline_at IS
    'Échéance de remise des avis, figée à la transmission avec le délai légal du moment (guard delaiAvisEcoule).';
COMMENT ON COLUMN public.demarche.plan_action_id IS
    'Plan d''action (axe racine) rattaché à la démarche pour le programme d''actions.';

CREATE INDEX demarche_collectivite_id_idx ON public.demarche (collectivite_id);
CREATE INDEX demarche_plan_action_id_idx ON public.demarche (plan_action_id);

-- Une seule démarche « en cours » par collectivité et par type : un nouveau
-- dépôt n'est possible qu'une fois la précédente adoptée ou archivée.
CREATE UNIQUE INDEX demarche_active_unique
    ON public.demarche (collectivite_id, type)
    WHERE status IN ('en_elaboration', 'transmis_pour_avis');

CREATE TABLE public.demarche_pilote (
    demarche_id integer     NOT NULL REFERENCES public.demarche(id) ON DELETE CASCADE,
    tag_id      integer     NULL REFERENCES public.personne_tag(id) ON DELETE CASCADE,
    user_id     uuid        NULL REFERENCES public.dcp(user_id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid        NULL,
    CONSTRAINT demarche_pilote_tag_or_user CHECK (tag_id IS NOT NULL OR user_id IS NOT NULL)
);

COMMENT ON TABLE public.demarche_pilote IS
    'Pilotes d''une démarche : personne référencée par tag ou compte utilisateur (même modèle que plan_pilote).';

-- NULLS NOT DISTINCT : chaque ligne a un NULL (tag OU user), sans quoi
-- l'unicité ne s'appliquerait jamais (les NULL sont distincts par défaut).
CREATE UNIQUE INDEX demarche_pilote_demarche_id_user_id_tag_id_key
    ON public.demarche_pilote (demarche_id, user_id, tag_id) NULLS NOT DISTINCT;

-- Index des FK portant un ON DELETE (cascade/set null).
CREATE INDEX demarche_pilote_tag_id_idx ON public.demarche_pilote (tag_id);
CREATE INDEX demarche_pilote_user_id_idx ON public.demarche_pilote (user_id);

CREATE TABLE public.demarche_status_history (
    id          serial      PRIMARY KEY,
    demarche_id integer     NOT NULL REFERENCES public.demarche(id) ON DELETE CASCADE,
    from_status text        NULL,
    to_status   text        NOT NULL,
    transition  text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid        NULL
);

COMMENT ON TABLE public.demarche_status_history IS
    'Journal des transitions de statut d''une démarche (alimente l''historique, la vue instructeur et les notifications).';
COMMENT ON COLUMN public.demarche_status_history.transition IS
    'Nom métier de la transition appliquée (cf. les transitions du workflow du type de démarche).';

CREATE INDEX demarche_status_history_demarche_id_idx
    ON public.demarche_status_history (demarche_id);

-- RLS sans policy : seul service_role (backend NestJS) accède à ces tables.
-- Les clients PostgREST `authenticated` ou `anon` sont silencieusement refusés.
-- Tout l'accès passe par tRPC.
ALTER TABLE public.demarche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_pilote ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_status_history ENABLE ROW LEVEL SECURITY;

COMMIT;
