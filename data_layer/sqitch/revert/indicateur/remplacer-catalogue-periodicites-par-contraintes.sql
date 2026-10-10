-- Revert tet:indicateur/remplacer-catalogue-periodicites-par-contraintes from pg

BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Restaure le catalogue et ses droits du schéma préparatoire, sans toucher aux valeurs.
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


ALTER TABLE public.indicateur_definition
    ADD CONSTRAINT indicateur_definition_periodicite_fkey
        FOREIGN KEY (periodicite) REFERENCES public.indicateur_periodicite(code),
    DROP CONSTRAINT indicateur_definition_periodicite_check;
ALTER TABLE public.indicateur_valeur
    ADD CONSTRAINT indicateur_valeur_periodicite_fkey
        FOREIGN KEY (periodicite) REFERENCES public.indicateur_periodicite(code),
    DROP CONSTRAINT indicateur_valeur_periodicite_check;
COMMIT;
