-- Deploy tet:demarche/pcaet_diagnostic to pg

BEGIN;

-- ===========================================================================
-- 1. Référentiel du diagnostic : les topics attendus au dépôt et les lignes
--    d'indicateurs de chacun. Tables de référence, lecture ouverte, alimentées
--    par cette migration.
-- ===========================================================================
CREATE TABLE public.demarche_pcaet_topic (
    id              serial      PRIMARY KEY,
    code            text        NOT NULL UNIQUE,
    label           text        NOT NULL,
    icon            text        NOT NULL,
    kind            text        NOT NULL CHECK (kind IN ('indicateurs', 'vulnerabilite')),
    group_label     text        NULL,
    row_label       text        NULL,
    unit            text        NULL,
    referentiel_id  text        NULL,
    horizons        integer[]   NOT NULL DEFAULT '{2030,2036,2050}',
    display_order   integer     NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    modified_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.demarche_pcaet_topic IS
    'Topics du diagnostic PCAET : un onglet de l''écran « Compléter le diagnostic et les objectifs », avec l''unité et les horizons réglementaires communs à ses lignes.';
COMMENT ON COLUMN public.demarche_pcaet_topic.code IS
    'Identifiant métier stable du topic, porté par l''URL et les tests e2e.';
COMMENT ON COLUMN public.demarche_pcaet_topic.icon IS
    'Nom de l''icône RemixIcon de l''onglet.';
COMMENT ON COLUMN public.demarche_pcaet_topic.kind IS
    'indicateurs = grille de saisie adossée au référentiel CAE ; vulnerabilite = table de niveaux par domaine.';
COMMENT ON COLUMN public.demarche_pcaet_topic.group_label IS
    'Nom métier des lignes de premier niveau (Secteur, Polluant, Vecteur…), affiché en en-tête de la colonne des libellés.';
COMMENT ON COLUMN public.demarche_pcaet_topic.row_label IS
    'Nom métier des lignes de second niveau. NULL quand le topic est à un seul niveau.';
COMMENT ON COLUMN public.demarche_pcaet_topic.unit IS
    'Unité commune aux indicateurs du topic.';
COMMENT ON COLUMN public.demarche_pcaet_topic.referentiel_id IS
    'Indicateur agrégé du topic (cae_1.a, cae_2.a…). Pas de FK : les migrations tournent avant l''import des référentiels, la résolution se fait par jointure à la lecture.';
COMMENT ON COLUMN public.demarche_pcaet_topic.horizons IS
    'Années d''objectif réglementaires, ajoutées en colonnes à l''année de comptabilisation.';

-- Une ligne du diagnostic, à un ou deux niveaux. Les deux niveaux portent la
-- même chose : un libellé, l'indicateur dont les valeurs sont saisies, et le
-- caractère obligatoire au dépôt. Un secteur peut donc porter sa propre valeur
-- et se décomposer en sous-lignes qui portent les leurs.
CREATE TABLE public.demarche_pcaet_topic_row (
    id              serial      PRIMARY KEY,
    topic_id        integer     NOT NULL
        REFERENCES public.demarche_pcaet_topic(id) ON DELETE CASCADE,
    parent_id       integer     NULL
        REFERENCES public.demarche_pcaet_topic_row(id) ON DELETE CASCADE,
    label           text        NOT NULL,
    referentiel_id  text        NULL,
    requis          boolean     NOT NULL DEFAULT true,
    display_order   integer     NOT NULL
);

COMMENT ON TABLE public.demarche_pcaet_topic_row IS
    'Ligne de saisie d''un topic. parent_id NULL = premier niveau (cf. demarche_pcaet_topic.group_label), renseigné = second niveau. La profondeur s''arrête à deux, contrat vérifié par les tests pgTAP.';
COMMENT ON COLUMN public.demarche_pcaet_topic_row.referentiel_id IS
    'Identifiant de l''indicateur dont la ligne porte les valeurs. NULL pour un regroupement sans indicateur propre (les vecteurs ENR).';
COMMENT ON COLUMN public.demarche_pcaet_topic_row.requis IS
    'Une ligne requise doit être renseignée pour que le topic soit complet.';

CREATE UNIQUE INDEX demarche_pcaet_topic_row_topic_id_parent_id_label_key
    ON public.demarche_pcaet_topic_row (topic_id, parent_id, label) NULLS NOT DISTINCT;

-- Un indicateur ne se saisit qu'une fois par topic.
CREATE UNIQUE INDEX demarche_pcaet_topic_row_topic_id_referentiel_id_key
    ON public.demarche_pcaet_topic_row (topic_id, referentiel_id)
    WHERE referentiel_id IS NOT NULL;

CREATE INDEX demarche_pcaet_topic_row_parent_id_idx
    ON public.demarche_pcaet_topic_row (parent_id);

ALTER TABLE public.demarche_pcaet_topic     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_pcaet_topic_row ENABLE ROW LEVEL SECURITY;

-- Données de référence non sensibles, comme demarche_document_definition.
CREATE POLICY allow_read ON public.demarche_pcaet_topic
    FOR SELECT USING (true);
CREATE POLICY allow_read ON public.demarche_pcaet_topic_row
    FOR SELECT USING (true);

-- ===========================================================================
-- 2. État du diagnostic d'une démarche.
--    Les valeurs elles-mêmes vivent dans indicateur_valeur, partagées avec les
--    pages indicateurs : seule l'année de comptabilisation est propre au dépôt.
-- ===========================================================================
CREATE TABLE public.demarche_pcaet_diagnostic_state (
    demarche_id     integer     NOT NULL
        REFERENCES public.demarche(id) ON DELETE CASCADE,
    topic_id        integer     NOT NULL
        REFERENCES public.demarche_pcaet_topic(id) ON DELETE CASCADE,
    reference_year  integer     NOT NULL,
    extra_years     integer[]   NOT NULL DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid        NULL,
    modified_at     timestamptz NOT NULL DEFAULT now(),
    modified_by     uuid        NULL,
    PRIMARY KEY (demarche_id, topic_id)
);

COMMENT ON TABLE public.demarche_pcaet_diagnostic_state IS
    'Réglages du diagnostic propres à une démarche. En l''absence de ligne, l''année de comptabilisation proposée est déduite des valeurs existantes.';
COMMENT ON COLUMN public.demarche_pcaet_diagnostic_state.reference_year IS
    'Année de comptabilisation choisie par la collectivité, celle que le décret demande de nommer.';
COMMENT ON COLUMN public.demarche_pcaet_diagnostic_state.extra_years IS
    'Années ajoutées en colonnes : les inventaires ne sortent pas la même année selon les secteurs, et une collectivité peut se fixer des jalons intermédiaires.';

CREATE INDEX demarche_pcaet_diagnostic_state_topic_id_idx
    ON public.demarche_pcaet_diagnostic_state (topic_id);

-- Photo du diagnostic à un jalon du cycle de vie : c'est elle que consultent
-- les instances consultatives. Les valeurs de la collectivité continuent
-- d'évoluer côté indicateurs sans affecter ce qui a été transmis.
CREATE TABLE public.demarche_pcaet_diagnostic_snapshot (
    id          serial      PRIMARY KEY,
    demarche_id integer     NOT NULL
        REFERENCES public.demarche(id) ON DELETE CASCADE,
    jalon       text        NOT NULL CHECK (jalon IN ('transmission')),
    date        timestamptz NOT NULL DEFAULT now(),
    payload     jsonb       NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid        NULL,
    UNIQUE (demarche_id, jalon, date)
);

COMMENT ON TABLE public.demarche_pcaet_diagnostic_snapshot IS
    'Diagnostic figé à un jalon du dépôt (aujourd''hui la transmission pour avis). Étendre le CHECK de jalon pour en ajouter un.';
COMMENT ON COLUMN public.demarche_pcaet_diagnostic_snapshot.payload IS
    'Diagnostic complet au moment du jalon, dans la forme servie par demarches.pcaet.diagnostic.get.';

ALTER TABLE public.demarche_pcaet_diagnostic_state    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_pcaet_diagnostic_snapshot ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- 3. Référentiel PCAET.
--    Granularité du décret : les secteurs de premier niveau pour les émissions
--    de GES et la consommation énergétique, les décompositions attendues pour
--    la séquestration, les polluants par secteur.
-- ===========================================================================

INSERT INTO public.demarche_pcaet_topic
    (code, label, icon, kind, group_label, row_label, unit, referentiel_id, horizons, display_order)
VALUES
    ('profil_energie_climat', 'Profil énergie climat', 'fire-line', 'indicateurs',
     'Secteur', NULL, 'kteq CO2', 'cae_1.a', '{2030,2036,2050}', 1),
    ('consommation_energetique', 'Consommation énergétique finale', 'flashlight-line', 'indicateurs',
     'Secteur', NULL, 'GWh', 'cae_2.a', '{2030,2036,2050}', 2),
    ('sequestration', 'Séquestration carbone', 'seedling-line', 'indicateurs',
     'Poste', NULL, 'kteq CO2', 'cae_63.a', '{2030,2036,2050}', 3),
    ('polluants_atmospheriques', 'Polluants atmosphériques', 'haze-2-line', 'indicateurs',
     'Polluant', 'Secteur', 'tonnes', 'emission_polluants_atmo', '{2030,2036,2050}', 4),
    ('enr', 'Énergies renouvelables', 'sun-line', 'indicateurs',
     'Vecteur', 'Filière', 'MWh', 'cae_3.a', '{2030,2036,2050}', 5),
    -- La saisie des niveaux de vulnérabilité par domaine n'est pas adossée au
    -- référentiel indicateurs ; ses horizons sont ceux de sa table.
    ('vulnerabilite_territoire', 'Vulnérabilité du territoire', 'map-2-line', 'vulnerabilite',
     NULL, NULL, NULL, NULL, '{2050,2100}', 6);

-- Lignes de premier niveau.
INSERT INTO public.demarche_pcaet_topic_row
    (topic_id, parent_id, label, referentiel_id, requis, display_order)
SELECT t.id, NULL, r.label, r.referentiel_id, r.requis, r.display_order
FROM public.demarche_pcaet_topic t
JOIN (VALUES
    -- Émissions de GES par secteur (art. R229-51, arrêté du 4 août 2016).
    ('profil_energie_climat', 'Résidentiel', 'cae_1.c', true, 1),
    ('profil_energie_climat', 'Tertiaire', 'cae_1.d', true, 2),
    ('profil_energie_climat', 'Transport routier', 'cae_1.e', true, 3),
    ('profil_energie_climat', 'Autres transports', 'cae_1.f', true, 4),
    ('profil_energie_climat', 'Agriculture', 'cae_1.g', true, 5),
    ('profil_energie_climat', 'Déchets', 'cae_1.h', true, 6),
    ('profil_energie_climat', 'Industrie hors branche énergie', 'cae_1.i', true, 7),
    ('profil_energie_climat', 'Branche énergie', 'cae_1.j', true, 8),

    -- Consommation énergétique finale, mêmes secteurs.
    ('consommation_energetique', 'Résidentiel', 'cae_2.e', true, 1),
    ('consommation_energetique', 'Tertiaire', 'cae_2.f', true, 2),
    ('consommation_energetique', 'Transport routier', 'cae_2.g', true, 3),
    ('consommation_energetique', 'Autres transports', 'cae_2.h', true, 4),
    ('consommation_energetique', 'Agriculture', 'cae_2.i', true, 5),
    ('consommation_energetique', 'Déchets', 'cae_2.j', true, 6),
    ('consommation_energetique', 'Industrie hors branche énergie', 'cae_2.k', true, 7),
    ('consommation_energetique', 'Branche énergie', 'cae_2.l_pcaet', true, 8),

    -- Séquestration : le décret identifie au moins les sols agricoles et la forêt.
    ('sequestration', 'Forêt', 'cae_63.b', true, 1),
    ('sequestration', 'Terres agricoles et prairies', 'cae_63.c', true, 2),
    ('sequestration', 'Autres sols', 'cae_63.d', false, 3),
    ('sequestration', 'Produits bois', 'cae_63.e', false, 4),

    -- Polluants atmosphériques : le total de chaque polluant porte la ligne.
    ('polluants_atmospheriques', 'NOx', 'cae_4.a', true, 1),
    ('polluants_atmospheriques', 'PM10', 'cae_4.b', true, 2),
    ('polluants_atmospheriques', 'PM2.5', 'cae_4.c', true, 3),
    ('polluants_atmospheriques', 'COVNM', 'cae_4.d', true, 4),
    ('polluants_atmospheriques', 'SO2', 'cae_4.e', true, 5),
    ('polluants_atmospheriques', 'NH3', 'cae_4.f', true, 6),

    -- Vecteurs ENR : regroupements sans indicateur propre. Le détail des
    -- filières attend l'arbitrage sur la chaleur, le froid et les biocarburants.
    ('enr', 'Électrique', NULL, false, 1),
    ('enr', 'Thermique', NULL, false, 2),
    ('enr', 'Gaz', NULL, false, 3)
) AS r(topic_code, label, referentiel_id, requis, display_order) ON r.topic_code = t.code;

-- Polluants atmosphériques : les 54 lignes de second niveau sont le produit des
-- 6 polluants par les 9 secteurs, l'identifiant suivant la convention
-- cae_4.<lettre du polluant><lettre du secteur>.
INSERT INTO public.demarche_pcaet_topic_row
    (topic_id, parent_id, label, referentiel_id, requis, display_order)
SELECT parent.topic_id, parent.id, s.label,
       'cae_4.' || p.lettre || s.lettre, true, s.display_order
FROM (VALUES
    ('NOx', 'a'), ('PM10', 'b'), ('PM2.5', 'c'),
    ('COVNM', 'd'), ('SO2', 'e'), ('NH3', 'f')
) AS p(label, lettre)
JOIN public.demarche_pcaet_topic_row parent
  ON parent.label = p.label
 AND parent.parent_id IS NULL
 AND parent.topic_id = (SELECT id FROM public.demarche_pcaet_topic
                        WHERE code = 'polluants_atmospheriques')
CROSS JOIN (VALUES
    ('Résidentiel', 'a', 1), ('Tertiaire', 'b', 2),
    ('Transport routier', 'g', 3), ('Autres transports', 'h', 4),
    ('Agriculture', 'c', 5), ('Déchets', 'd', 6),
    ('Industrie hors branche énergie', 'e', 7), ('Branche énergie', 'f', 8),
    ('Chantiers', 'i', 9)
) AS s(label, lettre, display_order);

-- Filières ENR par vecteur.
INSERT INTO public.demarche_pcaet_topic_row
    (topic_id, parent_id, label, referentiel_id, requis, display_order)
SELECT parent.topic_id, parent.id, f.label, f.referentiel_id, false, f.display_order
FROM public.demarche_pcaet_topic_row parent
JOIN public.demarche_pcaet_topic t
  ON t.id = parent.topic_id AND t.code = 'enr'
JOIN (VALUES
    ('Électrique', 'Éolien terrestre', 'cae_3.ad', 1),
    ('Électrique', 'Solaire photovoltaïque', 'cae_3.ac', 2),
    ('Électrique', 'Hydrolien', 'cae_3.aq', 3),
    ('Électrique', 'Biomasse solide', 'cae_3.ab', 4),
    ('Électrique', 'Méthanisation', 'cae_3.aa', 5),
    ('Électrique', 'Déchets', 'cae_3.ae', 6),
    ('Thermique', 'Biomasse solide', 'cae_3.ag', 1),
    ('Thermique', 'Chaufferies bois', 'cae_3.ah', 2),
    ('Thermique', 'Bois domestique', 'cae_3.ai', 3),
    ('Thermique', 'Solaire thermique', 'cae_3.aj', 4),
    ('Thermique', 'Géothermie profonde', 'cae_3.ak', 5),
    ('Thermique', 'Géothermie de surface (PAC)', 'cae_3.am', 6),
    ('Thermique', 'Aérothermie (PAC)', 'cae_3.an', 7),
    ('Thermique', 'Méthanisation', 'cae_3.af', 8),
    ('Thermique', 'Déchets', 'cae_3.ao', 9),
    ('Thermique', 'Autre', 'cae_3.ap', 10),
    ('Gaz', 'Méthanisation', 'cae_3.c', 1)
) AS f(vecteur, label, referentiel_id, display_order)
  ON f.vecteur = parent.label
WHERE parent.parent_id IS NULL;

COMMIT;
