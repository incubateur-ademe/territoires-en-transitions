-- Revert tet:indicateur/periodicite_obligatoire from pg

BEGIN;

SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN ACCESS EXCLUSIVE MODE;

CREATE UNIQUE INDEX unique_indicateur_valeur_utilisateur
    ON public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur)
    WHERE metadonnee_id IS NULL;
CREATE UNIQUE INDEX unique_indicateur_valeur_importee
    ON public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id)
    WHERE metadonnee_id IS NOT NULL;

ALTER TABLE public.indicateur_definition
    ALTER COLUMN periodicite DROP NOT NULL,
    ALTER COLUMN periodicite SET DEFAULT 'annuelle';

COMMIT;
