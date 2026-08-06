-- Deploy tet:demarche/demarche_documents to pg

BEGIN;

-- ===========================================================================
-- 1. Modèle documentaire : le catalogue des pièces attendues, par type de
--    démarche (même héritage par discriminant que la table demarche).
--    Tables de référence, lecture ouverte, alimentées par cette migration.
-- ===========================================================================
CREATE TABLE public.demarche_document_definition (
    id                    text        PRIMARY KEY,
    demarche_type         text        NOT NULL CHECK (demarche_type IN ('pcaet')),
    nom                   text        NOT NULL,
    description           text        NOT NULL DEFAULT '',
    requis                boolean     NOT NULL DEFAULT true,
    ordre                 integer     NOT NULL,
    portee                text        NOT NULL DEFAULT 'section'
                              CHECK (portee IN ('global', 'section')),
    couverture_plateforme text        NULL
                              CHECK (couverture_plateforme IN ('plan_actions')),
    created_at            timestamptz NOT NULL DEFAULT now(),
    modified_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.demarche_document_definition IS
    'Catalogue des pièces attendues au dépôt, par type de démarche (identifiant métier stable, libellé, caractère obligatoire, ordre d''affichage). La liste ne vit plus dans le code du front.';
COMMENT ON COLUMN public.demarche_document_definition.demarche_type IS
    'Type de démarche auquel s''applique cette pièce : étendre le CHECK à chaque nouveau type (cf. demarche.type).';
COMMENT ON COLUMN public.demarche_document_definition.requis IS
    'Une pièce requise doit être couverte (dépôt, substitution ou couverture plateforme) pour que l''étape Documents du dossier soit complète.';
COMMENT ON COLUMN public.demarche_document_definition.portee IS
    'global = document unique regroupant l''ensemble du dossier ; section = pièce listée dans le « Détail par section attendue ».';
COMMENT ON COLUMN public.demarche_document_definition.couverture_plateforme IS
    'Couverture alternative sans document : la pièce peut être déclarée prise en charge par une fonctionnalité de la plateforme (aujourd''hui uniquement plan_actions). Étendre le CHECK pour en ajouter une.';

CREATE INDEX demarche_document_definition_demarche_type_ordre_idx
    ON public.demarche_document_definition (demarche_type, ordre);

-- Substitution déclarative : le dépôt de substitut_id couvre document_id.
CREATE TABLE public.demarche_document_substitution (
    document_id  text NOT NULL
        REFERENCES public.demarche_document_definition(id) ON DELETE CASCADE,
    substitut_id text NOT NULL
        REFERENCES public.demarche_document_definition(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, substitut_id),
    CONSTRAINT demarche_document_substitution_no_self
        CHECK (document_id <> substitut_id)
);

COMMENT ON TABLE public.demarche_document_substitution IS
    'Substitution déclarative entre pièces attendues : déposer substitut_id couvre document_id. C''est ainsi qu''un document global couvre toutes les sections, sans règle codée en dur.';

-- La PK couvre document_id ; on indexe le sens inverse (« que couvre ce dépôt ? »).
CREATE INDEX demarche_document_substitution_substitut_id_idx
    ON public.demarche_document_substitution (substitut_id);

ALTER TABLE public.demarche_document_definition   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_document_substitution ENABLE ROW LEVEL SECURITY;

-- Données de référence non sensibles, comme preuve_reglementaire_definition.
CREATE POLICY allow_read ON public.demarche_document_definition
    FOR SELECT USING (true);
CREATE POLICY allow_read ON public.demarche_document_substitution
    FOR SELECT USING (true);

-- ===========================================================================
-- 2. Pièces réellement déposées.
--    `LIKE labellisation.preuve_base INCLUDING ALL` reprend le tronc commun des
--    preuves : collectivite_id, fichier_id, url/titre, commentaire, modified_*,
--    le CHECK XOR fichier|lien et la colonne générée `lien`.
-- ===========================================================================
CREATE TABLE public.demarche_document (
    id          serial  PRIMARY KEY,
    LIKE labellisation.preuve_base INCLUDING ALL,
    demarche_id integer NOT NULL
        REFERENCES public.demarche(id) ON DELETE CASCADE,
    document_id text    NOT NULL
        REFERENCES public.demarche_document_definition(id)
);

COMMENT ON TABLE public.demarche_document IS
    'Pièce déposée pour une démarche. Même tronc commun que preuve_reglementaire ou annexe : le fichier vit dans la bibliothèque de la collectivité (labellisation.bibliotheque_fichier).';
COMMENT ON COLUMN public.demarche_document.document_id IS
    'Pièce attendue couverte par ce dépôt (cf. demarche_document_definition).';

-- LIKE ne copie pas les clés étrangères : on recrée celle vers collectivite,
-- comme les autres tables preuve_*. On ne pose volontairement pas de FK sur
-- fichier_id (référence indirecte vers la bibliothèque), pour ne pas bloquer la
-- suppression d'un fichier de bibliothèque.
ALTER TABLE public.demarche_document
    ADD CONSTRAINT demarche_document_collectivite_id
        FOREIGN KEY (collectivite_id) REFERENCES public.collectivite(id);

-- Le backend écrit en service_role : auth.uid() (défaut hérité de preuve_base)
-- vaut NULL. C'est le service qui renseigne l'auteur, comme sur demarche.
ALTER TABLE public.demarche_document
    ALTER COLUMN modified_by DROP NOT NULL,
    ALTER COLUMN modified_by DROP DEFAULT;

-- preuve_base impose un fichier OU un lien. Ici une pièce peut aussi être
-- satisfaite sans document : une ligne sans fichier ni lien déclare qu'elle est
-- prise en charge par la fonctionnalité de sa définition (couverture_plateforme).
ALTER TABLE public.demarche_document
    DROP CONSTRAINT preuve_base_check,
    ADD CONSTRAINT demarche_document_fichier_ou_lien
        CHECK (num_nonnulls(fichier_id, url) <= 1);

-- Une seule pièce par (démarche, définition) : « Remplacer le fichier » est un
-- upsert. L'unicité du document global en découle, sans coder son id ici.
CREATE UNIQUE INDEX demarche_document_demarche_id_document_id_key
    ON public.demarche_document (demarche_id, document_id);
CREATE INDEX demarche_document_collectivite_id_idx
    ON public.demarche_document (collectivite_id);
CREATE INDEX demarche_document_document_id_idx
    ON public.demarche_document (document_id);

-- RLS sans policy : seul service_role (backend NestJS) accède à cette table,
-- tout l'accès passe par tRPC — comme demarche.
ALTER TABLE public.demarche_document ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- 3. Modèle documentaire du PCAET : 1 document global + 9 pièces attendues.
--    Idempotent : une future migration de mise à jour rejoue le même INSERT.
-- ===========================================================================
INSERT INTO public.demarche_document_definition
    (id, demarche_type, nom, description, requis, ordre, portee, couverture_plateforme)
VALUES
    ('pcaet_document_global', 'pcaet',
     'Document global',
     'Document unique regroupant l''ensemble des pièces attendues. Son dépôt couvre toutes les sections du dossier.',
     false, 0, 'global', NULL),
    ('pcaet_diagnostic', 'pcaet', 'Diagnostic', '', true, 1, 'section', NULL),
    ('pcaet_strategie_territoriale', 'pcaet', 'Stratégie territoriale', '', true, 2, 'section', NULL),
    ('pcaet_plan_actions', 'pcaet', 'Plan d''actions', '', true, 3, 'section', NULL),
    ('pcaet_dispositif_suivi_evaluation', 'pcaet', 'Dispositif de suivi et d''évaluation', '',
     true, 4, 'section', 'plan_actions'),
    ('pcaet_ees', 'pcaet', 'EES (évaluation environnementale stratégique)', '', false, 5, 'section', NULL),
    ('pcaet_deliberation_adoption', 'pcaet', 'Délibération d''adoption', '', false, 6, 'section', NULL),
    ('pcaet_memoire_reponse_avis', 'pcaet', 'Mémoire de réponse aux avis institutionnels', '',
     false, 7, 'section', NULL),
    ('pcaet_synthese_consultation_publique', 'pcaet',
     'Synthèse des contributions et réponses à la consultation publique', '',
     false, 8, 'section', NULL),
    ('pcaet_bilan_pcaet_precedent', 'pcaet', 'Bilan de la démarche précédente', '', false, 9, 'section', NULL)
ON CONFLICT (id) DO UPDATE SET
    demarche_type         = excluded.demarche_type,
    nom                   = excluded.nom,
    description           = excluded.description,
    requis                = excluded.requis,
    ordre                 = excluded.ordre,
    portee                = excluded.portee,
    couverture_plateforme = excluded.couverture_plateforme,
    modified_at           = now();

-- Le document global du PCAET couvre toutes les sections attendues de ce type.
INSERT INTO public.demarche_document_substitution (document_id, substitut_id)
SELECT definition.id, 'pcaet_document_global'
FROM public.demarche_document_definition AS definition
WHERE definition.demarche_type = 'pcaet' AND definition.portee = 'section'
ON CONFLICT DO NOTHING;

COMMIT;
