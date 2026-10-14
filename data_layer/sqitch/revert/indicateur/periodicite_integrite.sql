-- Revert tet:indicateur/periodicite_integrite from pg
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER verifier_periodicite_valeur_indicateur ON public.indicateur_valeur;
DROP FUNCTION public.verifier_periodicite_valeur_indicateur();
DROP TRIGGER empecher_changement_periodicite_indicateur ON public.indicateur_definition;
DROP FUNCTION public.empecher_changement_periodicite_indicateur();
DROP TRIGGER verifier_periodicite_groupe_indicateur ON public.indicateur_groupe;
DROP FUNCTION public.verifier_periodicite_groupe_indicateur();
COMMENT ON COLUMN public.indicateur_definition.periodicite IS
    'Cadence de déclaration, référencée dans public.indicateur_periodicite.';
COMMIT;
