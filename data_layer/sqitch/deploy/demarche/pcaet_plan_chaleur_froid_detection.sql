-- Deploy tet:demarche/pcaet_plan_chaleur_froid_detection to pg
-- requires: demarche/pcaet_document_global_retire

BEGIN;

-- ===========================================================================
-- 1. Une substitution peut exiger que l'analyse du fichier déposé ait trouvé
--    la pièce : la case n'est proposée qu'après une détection positive.
-- ===========================================================================
ALTER TABLE public.demarche_document_substitution
    ADD COLUMN is_detection_required boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.demarche_document_substitution.is_detection_required IS
    'true : substitut_id ne couvre document_id que si l''analyse du fichier déposé pour substitut_id y a trouvé document_id (cf. demarche_document_detection).';

-- ===========================================================================
-- 2. Le PLCF (diagnostic, objectifs, programme d'actions) se répartit en
--    général dans le diagnostic, la stratégie et le programme d'actions du
--    PCAET : il peut être compris dans chacun, si l'analyse l'y trouve.
-- ===========================================================================
INSERT INTO public.demarche_document_substitution
    (document_id, substitut_id, automatic, is_detection_required)
VALUES ('pcaet_plan_chaleur_froid', 'pcaet_diagnostic', false, true),
       ('pcaet_plan_chaleur_froid', 'pcaet_strategie_territoriale', false, true),
       ('pcaet_plan_chaleur_froid', 'pcaet_plan_actions', false, true)
ON CONFLICT (document_id, substitut_id) DO UPDATE SET
    automatic             = excluded.automatic,
    is_detection_required = excluded.is_detection_required;

-- ===========================================================================
-- 3. Résultat de l'analyse d'un fichier déposé : contient-il telle pièce ?
--    Une ligne par (démarche, pièce analysée, pièce cherchée), remise à
--    `pending` à chaque nouveau fichier : `fichier_id` dit lequel a été lu.
-- ===========================================================================
CREATE TABLE public.demarche_document_detection (
    id                   serial      PRIMARY KEY,
    demarche_id          integer     NOT NULL
        REFERENCES public.demarche(id) ON DELETE CASCADE,
    document_id          text        NOT NULL
        REFERENCES public.demarche_document_definition(id) ON DELETE CASCADE,
    included_document_id text        NOT NULL
        REFERENCES public.demarche_document_definition(id) ON DELETE CASCADE,
    fichier_id           integer     NOT NULL,
    status               text        NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'done', 'failed')),
    is_included          boolean     NULL,
    parties              text[]      NOT NULL DEFAULT '{}'
        CHECK (parties <@ ARRAY['diagnostic', 'objectifs', 'programme_actions']),
    section_title        text        NULL,
    pages                text[]      NOT NULL DEFAULT '{}',
    justification        text        NOT NULL DEFAULT '',
    model                text        NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    analyzed_at          timestamptz NULL,
    CONSTRAINT demarche_document_detection_unique
        UNIQUE (demarche_id, document_id, included_document_id),
    CONSTRAINT demarche_document_detection_distincte
        CHECK (document_id <> included_document_id),
    CONSTRAINT demarche_document_detection_resultat
        CHECK ((status = 'done') = (is_included IS NOT NULL))
);

COMMENT ON TABLE public.demarche_document_detection IS
    'Analyse automatique d''un fichier déposé (document_id) : contient-il la pièce included_document_id ? Ne vaut que pour fichier_id : un fichier remplacé est réanalysé.';
COMMENT ON COLUMN public.demarche_document_detection.fichier_id IS
    'Fichier de la bibliothèque analysé. Pas de clé étrangère, comme demarche_document.fichier_id.';
COMMENT ON COLUMN public.demarche_document_detection.parties IS
    'Parties de la pièce cherchée repérées dans le document : diagnostic, objectifs, programme_actions.';
COMMENT ON COLUMN public.demarche_document_detection.pages IS
    'Pages du document où l''analyse a trouvé la pièce, telles qu''il les numérote (nom d''onglet pour un tableur).';

-- RLS sans policy : accès service_role uniquement, tout passe par tRPC — comme
-- demarche_document.
ALTER TABLE public.demarche_document_detection ENABLE ROW LEVEL SECURITY;

COMMIT;
