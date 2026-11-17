-- Deploy tet:demarche/pcaet_export to pg
-- requires: demarche/pcaet_supra_plusieurs_depots_en_cours

-- Les classeurs figés à la soumission d'un PCAET : à la transmission pour avis
-- puis à la publication, la plateforme exporte le plan et les données du
-- diagnostic et les range dans un bucket privé. Cette table dit ce qui a été
-- produit, et où.
--
-- Les lignes d'une transition sont écrites ensemble, dans la transaction de la
-- transition : l'absence de `plan_expurge` veut dire « aucune fiche
-- restreinte », jamais « génération incomplète ».

BEGIN;

CREATE TABLE public.demarche_pcaet_export (
    id           serial      PRIMARY KEY,
    demarche_id  integer     NOT NULL REFERENCES public.demarche (id) ON DELETE CASCADE,
    transition   text        NOT NULL,
    type         text        NOT NULL,
    storage_path text        NOT NULL,
    filename     text        NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid        NULL,
    CONSTRAINT demarche_pcaet_export_transition_check
        CHECK (transition IN ('transmettre_pour_avis', 'publier')),
    CONSTRAINT demarche_pcaet_export_type_check
        CHECK (type IN ('plan', 'plan_expurge', 'indicateurs')),
    CONSTRAINT demarche_pcaet_export_demarche_transition_type_key
        UNIQUE (demarche_id, transition, type)
);

COMMENT ON TABLE public.demarche_pcaet_export IS
    'Classeurs figés à la soumission d''un PCAET (transmission pour avis, publication), rangés dans le bucket privé demarches-pcaet-exports.';
COMMENT ON COLUMN public.demarche_pcaet_export.transition IS
    'transmettre_pour_avis | publier — la transition qui a figé le classeur. Les deux photos sont conservées.';
COMMENT ON COLUMN public.demarche_pcaet_export.type IS
    'plan | plan_expurge | indicateurs. plan_expurge est le classeur plan sans les fiches restreintes, servi aux lecteurs qui ne les voient pas à l''écran ; il n''existe que si le plan en compte au moins une, et n''est pas la version de la consultation publique.';
COMMENT ON COLUMN public.demarche_pcaet_export.storage_path IS
    'Chemin de l''objet dans le bucket : <demarche_id>/<transition>/<type>.xlsx.';
COMMENT ON COLUMN public.demarche_pcaet_export.filename IS
    'Nom proposé au téléchargement. Les deux variantes du plan portent le même : un lecteur ne reçoit jamais que l''une des deux.';

-- RLS sans policy : seul le backend (connexion directe) lit et écrit.
ALTER TABLE public.demarche_pcaet_export ENABLE ROW LEVEL SECURITY;

-- `public` est exposé à PostgREST, et Supabase y accorde par défaut l'accès à
-- anon/authenticated.
REVOKE ALL ON public.demarche_pcaet_export FROM anon, authenticated;

COMMIT;
