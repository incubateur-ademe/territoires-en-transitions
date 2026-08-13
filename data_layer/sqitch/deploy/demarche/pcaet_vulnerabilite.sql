-- Deploy tet:demarche/pcaet_vulnerabilite to pg

BEGIN;

-- ===========================================================================
-- 1. Domaines de vulnérabilité.
--    Une seule table pour le socle réglementaire et les domaines ajoutés par
--    une collectivité : les valeurs n'ont ainsi qu'une clé étrangère à suivre,
--    et le socle se distingue par collectivite_id IS NULL.
-- ===========================================================================
CREATE TABLE public.demarche_pcaet_vulnerabilite_domaine (
    id              serial      PRIMARY KEY,
    code            text        NULL,
    label           text        NOT NULL,
    collectivite_id integer     NULL
        REFERENCES public.collectivite(id) ON DELETE CASCADE,
    requis          boolean     NOT NULL DEFAULT true,
    display_order   integer     NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid        NULL,
    modified_at     timestamptz NOT NULL DEFAULT now(),
    modified_by     uuid        NULL,
    -- Le socle porte un code métier stable, les ajouts n'en ont pas : rien ne
    -- garantirait leur unicité au-delà d'une collectivité.
    CONSTRAINT demarche_pcaet_vulnerabilite_domaine_code_socle_check
        CHECK ((collectivite_id IS NULL) = (code IS NOT NULL)),
    -- Borne alignée sur le schéma Zod du domaine : la base ne doit pas accepter
    -- ce que l'API refuse, sans quoi un import la contournerait.
    CONSTRAINT demarche_pcaet_vulnerabilite_domaine_label_check
        CHECK (char_length(label) BETWEEN 1 AND 120)
);

COMMENT ON TABLE public.demarche_pcaet_vulnerabilite_domaine IS
    'Domaines et milieux de vulnérabilité du territoire. collectivite_id NULL = socle commun, ni renommable ni supprimable ; renseigné = domaine ajouté par la collectivité, partagé par toutes ses démarches.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_domaine.code IS
    'Identifiant métier stable du domaine du socle, sur lequel s''appuient les tests et les futures migrations. NULL pour un domaine ajouté.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_domaine.collectivite_id IS
    'Collectivité propriétaire du domaine ajouté. NULL pour le socle.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_domaine.requis IS
    'Un domaine requis doit être renseigné pour que la vulnérabilité soit complète. Fixé par migration : l''échappatoire offerte à la collectivité est le niveau « non concerné », pas la dispense.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_domaine.display_order IS
    'Ordre d''affichage. Le socle occupe la plage basse, les ajouts se rangent au-delà de 1000.';

CREATE UNIQUE INDEX demarche_pcaet_vulnerabilite_domaine_code_key
    ON public.demarche_pcaet_vulnerabilite_domaine (code)
    WHERE collectivite_id IS NULL;

-- Deux fois le même domaine ajouté n'a pas de sens : la casse ne suffit pas à
-- les distinguer.
CREATE UNIQUE INDEX demarche_pcaet_vulnerabilite_domaine_collectivite_label_key
    ON public.demarche_pcaet_vulnerabilite_domaine (collectivite_id, lower(label))
    WHERE collectivite_id IS NOT NULL;

-- La lecture liste « socle OU domaines de la collectivité » : le OR interdit
-- d'exploiter l'index partiel ci-dessus, et la table est globale.
CREATE INDEX demarche_pcaet_vulnerabilite_domaine_collectivite_id_idx
    ON public.demarche_pcaet_vulnerabilite_domaine (collectivite_id);

-- ===========================================================================
-- 2. Saisie d'une démarche : un niveau par horizon et les objectifs associés.
--    L'absence de valeur est un NULL — il n'y a pas de niveau « non renseigné »,
--    « non concerné » étant un choix explicite de la collectivité.
-- ===========================================================================
CREATE TABLE public.demarche_pcaet_vulnerabilite_valeur (
    demarche_id       integer     NOT NULL
        REFERENCES public.demarche(id) ON DELETE CASCADE,
    domaine_id        integer     NOT NULL
        REFERENCES public.demarche_pcaet_vulnerabilite_domaine(id) ON DELETE CASCADE,
    niveau_maintenant text        NULL
        CHECK (niveau_maintenant IN ('non_concerne', 'faible', 'moyen', 'fort')),
    niveau_2050       text        NULL
        CHECK (niveau_2050 IN ('non_concerne', 'faible', 'moyen', 'fort')),
    niveau_2100       text        NULL
        CHECK (niveau_2100 IN ('non_concerne', 'faible', 'moyen', 'fort')),
    -- Bornes alignées sur le schéma Zod du domaine.
    objectifs_2050    text        NULL CHECK (char_length(objectifs_2050) <= 2000),
    objectifs_2100    text        NULL CHECK (char_length(objectifs_2100) <= 2000),
    created_at        timestamptz NOT NULL DEFAULT now(),
    created_by        uuid        NULL,
    modified_at       timestamptz NOT NULL DEFAULT now(),
    modified_by       uuid        NULL,
    PRIMARY KEY (demarche_id, domaine_id)
);

COMMENT ON TABLE public.demarche_pcaet_vulnerabilite_valeur IS
    'Diagnostic de vulnérabilité d''une démarche pour un domaine : les niveaux constatés et projetés, et les objectifs d''adaptation décrits. Une ligne absente vaut domaine non renseigné.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_valeur.niveau_maintenant IS
    'Niveau de vulnérabilité correspondant à la situation actuelle du territoire.';
COMMENT ON COLUMN public.demarche_pcaet_vulnerabilite_valeur.objectifs_2050 IS
    'Objectifs d''adaptation à l''horizon 2050. Non exigés quand le niveau de l''horizon est « non concerné ».';

CREATE INDEX demarche_pcaet_vulnerabilite_valeur_domaine_id_idx
    ON public.demarche_pcaet_vulnerabilite_valeur (domaine_id);

-- La table des domaines mêle socle et données de collectivité : elle ne peut
-- pas être ouverte en lecture comme un référentiel. Tout passe par tRPC.
ALTER TABLE public.demarche_pcaet_vulnerabilite_domaine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_pcaet_vulnerabilite_valeur  ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- 3. Socle des domaines, repris de la liste indicative du cadre de dépôt
--    (Territoires & Climat). Tous requis : un territoire qui n'est pas
--    concerné le déclare, il ne l'omet pas.
-- ===========================================================================
INSERT INTO public.demarche_pcaet_vulnerabilite_domaine
    (code, label, collectivite_id, requis, display_order)
VALUES
    ('agriculture',     'Agriculture',                                      NULL, true,  1),
    ('amenagement',     'Aménagement / urbanisme',                          NULL, true,  2),
    ('biodiversite',    'Biodiversité',                                     NULL, true,  3),
    ('dechets',         'Déchets',                                          NULL, true,  4),
    ('eau',             'Eau',                                              NULL, true,  5),
    ('espaces_verts',   'Espaces verts',                                    NULL, true,  6),
    ('foret',           'Forêt',                                            NULL, true,  7),
    ('energie',         'Gestion, production et distribution de l''énergie', NULL, true,  8),
    ('industrie',       'Industrie',                                        NULL, true,  9),
    ('littoral',        'Littoral',                                         NULL, true, 10),
    ('residentiel',     'Résidentiel',                                      NULL, true, 11),
    ('sante',           'Santé',                                            NULL, true, 12),
    ('securite_civile', 'Sécurité civile',                                  NULL, true, 13),
    ('tertiaire',       'Tertiaire',                                        NULL, true, 14),
    ('tourisme',        'Tourisme',                                         NULL, true, 15),
    ('transport',       'Transport',                                        NULL, true, 16)
-- Rejouable : une migration ultérieure fera évoluer les libellés du socle en
-- réexécutant ce même INSERT.
ON CONFLICT (code) WHERE collectivite_id IS NULL DO UPDATE
    SET label         = EXCLUDED.label,
        requis        = EXCLUDED.requis,
        display_order = EXCLUDED.display_order,
        modified_at   = now();

COMMIT;
