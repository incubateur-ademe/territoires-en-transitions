-- Revert tet:indicateur/groupe_integrite from pg

BEGIN;

SET LOCAL lock_timeout = '5s';

DROP TRIGGER verifier_collectivite_groupe_indicateur ON public.indicateur_groupe;
DROP FUNCTION public.verifier_collectivite_groupe_indicateur();
ALTER TABLE public.indicateur_groupe
    DROP CONSTRAINT IF EXISTS indicateur_groupe_parent_distinct_enfant,
    DROP CONSTRAINT indicateur_groupe_enfant_unique;

COMMIT;
