-- Deploy tet:indicateur/periodicite_schema to pg
-- requires: indicateur/correct-dates-historiques

BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Livraison autonome compatible avec le backend annuel existant.
-- Les défauts classifient les données sans modifier dates, valeurs ou audit.
CREATE TABLE public.indicateur_periodicite
(
    code               text     PRIMARY KEY,
    unite_calendaire   text     NOT NULL
        CHECK (unite_calendaire IN ('mois', 'semaine', 'jour')),
    nombre_unites      integer  NOT NULL CHECK (nombre_unites > 0),
    date_ancrage       date     NOT NULL
        CONSTRAINT indicateur_periodicite_date_ancrage_supported_check
        CHECK (date_ancrage BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
    CONSTRAINT indicateur_periodicite_mois_valides_check
        CHECK (
            unite_calendaire <> 'mois'
            OR (
                EXTRACT(DAY FROM date_ancrage) = 1
                AND MOD(12, nombre_unites) = 0
            )
        )
);

COMMENT ON TABLE public.indicateur_periodicite IS
    'Catalogue en lecture seule des cadences applicables aux indicateurs. Une politique publiée est immuable ; changer son sens exige un nouveau code.';
COMMENT ON COLUMN public.indicateur_periodicite.date_ancrage IS
    'Début d''une période de référence utilisé pour aligner toutes les occurrences de la cadence.';

INSERT INTO public.indicateur_periodicite
    (code, unite_calendaire, nombre_unites, date_ancrage)
VALUES
    ('annuelle', 'mois', 12, DATE '2000-01-01'),
    ('semestrielle', 'mois', 6, DATE '2000-01-01'),
    ('trimestrielle', 'mois', 3, DATE '2000-01-01'),
    ('mensuelle', 'mois', 1, DATE '2000-01-01');

-- Catalogue public en lecture, mais administré uniquement par migration. Sans
-- cette frontière un client REST pourrait ajouter une cadence inconnue du
-- registre TypeScript ou modifier une ligne pas encore utilisée.
ALTER TABLE public.indicateur_periodicite ENABLE ROW LEVEL SECURITY;
CREATE POLICY indicateur_periodicite_allow_read
    ON public.indicateur_periodicite
    FOR SELECT
    USING (true);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.indicateur_periodicite
    FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.indicateur_periodicite
    TO anon, authenticated, service_role;

-- La colonne reste nullable pendant cette première étape de déploiement
-- progressif. La clé étrangère remplace une liste de valeurs codée en dur.
ALTER TABLE public.indicateur_definition
    ADD COLUMN periodicite text DEFAULT 'annuelle',
    ADD CONSTRAINT indicateur_definition_periodicite_fkey
        FOREIGN KEY (periodicite)
        REFERENCES public.indicateur_periodicite(code);

-- L'agrégation est une restitution explicitement configurée par champ.
-- NULL conserve uniquement la série déclarée, sans somme implicite.
ALTER TABLE public.indicateur_definition
    ADD COLUMN aggregation_resultat text
        CHECK (aggregation_resultat IN ('somme', 'moyenne', 'derniere_valeur')),
    ADD COLUMN aggregation_objectif text
        CHECK (aggregation_objectif IN ('somme', 'moyenne', 'derniere_valeur'));
ALTER TABLE public.indicateur_valeur
    ADD COLUMN periodicite text NOT NULL DEFAULT 'annuelle'
        REFERENCES public.indicateur_periodicite(code);

-- Les anciens index restent disponibles pour les ON CONFLICT du backend actuel.
-- Ils seront retirés avec la bascule vers le backend compatible.
CREATE UNIQUE INDEX unique_indicateur_valeur_utilisateur_periode
    ON public.indicateur_valeur (indicateur_id, collectivite_id, periodicite, date_valeur)
    WHERE metadonnee_id IS NULL;
CREATE UNIQUE INDEX unique_indicateur_valeur_importee_periode
    ON public.indicateur_valeur (indicateur_id, collectivite_id, periodicite, date_valeur, metadonnee_id)
    WHERE metadonnee_id IS NOT NULL;

CREATE FUNCTION public.empecher_modification_periodicite()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = format(
            'La politique de périodicité %s est immuable ; créer un nouveau code',
            OLD.code
        );
END;
$$;

CREATE TRIGGER empecher_modification_periodicite
    BEFORE UPDATE OR DELETE
    ON public.indicateur_periodicite
    FOR EACH ROW
    EXECUTE FUNCTION public.empecher_modification_periodicite();


-- Ces garde-fous ferment les nouvelles fonctionnalités jusqu'au backend.
-- Aucune contrainte ne normalise ni ne refuse les dates historiques ici.
ALTER TABLE public.indicateur_definition
    ADD CONSTRAINT indicateur_definition_schema_annuel CHECK (
        periodicite IS NOT DISTINCT FROM 'annuelle'
        AND aggregation_resultat IS NULL AND aggregation_objectif IS NULL
    );
ALTER TABLE public.indicateur_valeur
    ADD CONSTRAINT indicateur_valeur_schema_annuel CHECK (periodicite = 'annuelle');

COMMIT;
