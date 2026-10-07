-- Deploy tet:demarche/demarche_documents_additional to pg
-- requires: demarche/pcaet_documents_amont

BEGIN;

-- ===========================================================================
-- 1. Configuration d'un type de démarche : ce que le produit autorise pour ce
--    type, au-delà du catalogue des pièces attendues. Même héritage par
--    discriminant que demarche et demarche_document_definition, mais une seule
--    ligne par type — c'est la définition du type, pas de ses pièces.
-- ===========================================================================
CREATE TABLE public.demarche_definition (
    demarche_type                  text        PRIMARY KEY
                                       CHECK (demarche_type IN ('pcaet')),
    documents_additional_amont         boolean     NOT NULL DEFAULT false,
    documents_additional_aval          boolean     NOT NULL DEFAULT false,
    documents_formats_autorises    text[]      NULL,
    documents_mime_types_autorises text[]      NULL,
    created_at                     timestamptz NOT NULL DEFAULT now(),
    modified_at                    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.demarche_definition IS
    'Configuration d''un type de démarche : ce que le dépôt autorise, hors catalogue des pièces attendues (cf. demarche_document_definition). Une ligne par type, alimentée par migration.';
COMMENT ON COLUMN public.demarche_definition.documents_additional_amont IS
    'La collectivité peut joindre au dossier d''élaboration des pièces hors catalogue, avec un titre libre.';
COMMENT ON COLUMN public.demarche_definition.documents_additional_aval IS
    'Même autorisation pour les pièces produites après les avis.';
COMMENT ON COLUMN public.demarche_definition.documents_formats_autorises IS
    'Extensions acceptées, sans le point et en minuscules (ex. {pdf}). NULL = aucune restriction propre au type : les formats de la bibliothèque de documents s''appliquent.';
COMMENT ON COLUMN public.demarche_definition.documents_mime_types_autorises IS
    'Types MIME acceptés, vérifiés en plus de l''extension quand le stockage les connaît. NULL = aucune restriction.';

ALTER TABLE public.demarche_definition ENABLE ROW LEVEL SECURITY;

-- Donnée de référence non sensible, comme demarche_document_definition.
CREATE POLICY allow_read ON public.demarche_definition
    FOR SELECT USING (true);

-- Le dossier PCAET est réglementaire : pièces additionnelles autorisées aux
-- deux étapes, PDF uniquement. La restriction vivait en dur dans le domaine,
-- elle devient de la donnée.
INSERT INTO public.demarche_definition
    (demarche_type, documents_additional_amont, documents_additional_aval,
     documents_formats_autorises, documents_mime_types_autorises)
VALUES
    ('pcaet', true, true, ARRAY['pdf'], ARRAY['application/pdf'])
ON CONFLICT (demarche_type) DO UPDATE SET
    documents_additional_amont         = excluded.documents_additional_amont,
    documents_additional_aval          = excluded.documents_additional_aval,
    documents_formats_autorises    = excluded.documents_formats_autorises,
    documents_mime_types_autorises = excluded.documents_mime_types_autorises,
    modified_at                    = now();

-- ===========================================================================
-- 2. Pièces additionnelles déposées : hors catalogue, titrées par la collectivité.
--    Même tronc commun que demarche_document (LIKE labellisation.preuve_base),
--    mais pas de document_id : c'est le titre qui identifie la pièce, et il n'y
--    a pas d'unicité — la collectivité en ajoute autant qu'elle veut.
-- ===========================================================================
CREATE TABLE public.demarche_document_additional (
    id          serial  PRIMARY KEY,
    LIKE labellisation.preuve_base INCLUDING ALL,
    demarche_id integer NOT NULL
        REFERENCES public.demarche(id) ON DELETE CASCADE,
    etape       text    NOT NULL
        CHECK (etape IN ('amont', 'aval'))
);

COMMENT ON TABLE public.demarche_document_additional IS
    'Pièce additionnelle par la collectivité au dossier d''une démarche, hors catalogue des pièces attendues. Toujours optionnelle : elle ne pèse ni sur la transmission ni sur la publication.';
COMMENT ON COLUMN public.demarche_document_additional.etape IS
    'Partie du dossier à laquelle la pièce est rattachée : amont (élaboration) ou aval (après les avis). Détermine à quels statuts elle reste modifiable.';
COMMENT ON COLUMN public.demarche_document_additional.titre IS
    'Intitulé saisi par la collectivité. Facultatif, et vide par défaut comme partout dans la famille preuve_base : la ligne s''ouvre sans nom, le titre et le fichier arrivent dans l''ordre que la collectivité choisit.';

-- LIKE ne copie pas les clés étrangères : on recrée celle vers collectivite,
-- comme demarche_document. Toujours pas de FK sur fichier_id (référence
-- indirecte vers la bibliothèque).
ALTER TABLE public.demarche_document_additional
    ADD CONSTRAINT demarche_document_additional_collectivite_id
        FOREIGN KEY (collectivite_id) REFERENCES public.collectivite(id);

-- Le backend écrit en service_role : auth.uid() vaut NULL, c'est le service qui
-- renseigne l'auteur.
ALTER TABLE public.demarche_document_additional
    ALTER COLUMN modified_by DROP NOT NULL,
    ALTER COLUMN modified_by DROP DEFAULT;

-- La ligne s'ouvre avant tout titre et tout dépôt : ni fichier ni lien ne sont
-- exigés, comme pour une couverture sur demarche_document. Le titre n'est pas
-- exigé non plus : il reste à sa valeur par défaut (chaîne vide, héritée de
-- preuve_base), la pièce s'affiche « Aucun nom défini » et se nomme quand la
-- collectivité le décide.
ALTER TABLE public.demarche_document_additional
    DROP CONSTRAINT preuve_base_check,
    ADD CONSTRAINT demarche_document_additional_fichier_ou_lien
        CHECK (num_nonnulls(fichier_id, url) <= 1);

CREATE INDEX demarche_document_additional_demarche_id_etape_idx
    ON public.demarche_document_additional (demarche_id, etape);
CREATE INDEX demarche_document_additional_collectivite_id_idx
    ON public.demarche_document_additional (collectivite_id);

-- RLS sans policy : accès service_role uniquement, tout passe par tRPC — comme
-- demarche_document.
ALTER TABLE public.demarche_document_additional ENABLE ROW LEVEL SECURITY;

COMMIT;
