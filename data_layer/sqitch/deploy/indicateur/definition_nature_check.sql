BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.indicateur_definition
    ADD CONSTRAINT indicateur_definition_nature_check
    CHECK (
        (collectivite_id IS NOT NULL
            AND identifiant_referentiel IS NULL
            AND groupement_id IS NULL)
        OR (collectivite_id IS NULL
            AND identifiant_referentiel IS NOT NULL)
    );

COMMIT;
