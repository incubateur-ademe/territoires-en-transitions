-- Revert tet:indicateur/periodicite_formules from pg

BEGIN;

SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER verifier_periodicite_dependances_formule
    ON public.indicateur_definition;

DROP FUNCTION private.verifier_periodicite_dependances_formule_trigger();
DROP FUNCTION private.verifier_periodicite_dependances_formule(integer, text[]);

COMMIT;
