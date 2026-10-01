-- Revert tet:indicateur/periodicite_schema from pg
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
    IF to_regclass('migration.indicateur_valeur_periodicite_audit') IS NOT NULL THEN
        RAISE EXCEPTION 'Revenir sur la livraison backend avant de retirer le schéma compatible';
    END IF;
    IF EXISTS (SELECT 1 FROM public.indicateur_definition
               WHERE periodicite IS DISTINCT FROM 'annuelle'
                  OR aggregation_resultat IS NOT NULL OR aggregation_objectif IS NOT NULL)
       OR EXISTS (SELECT 1 FROM public.indicateur_valeur WHERE periodicite <> 'annuelle') THEN
        RAISE EXCEPTION 'Le retour au schéma historique perdrait des informations de périodicité';
    END IF;
END $$;
ALTER TABLE public.indicateur_definition
    DROP COLUMN periodicite, DROP COLUMN aggregation_resultat, DROP COLUMN aggregation_objectif;
ALTER TABLE public.indicateur_valeur DROP COLUMN periodicite;
DROP TRIGGER empecher_modification_periodicite ON public.indicateur_periodicite;
DROP FUNCTION public.empecher_modification_periodicite();
DROP TABLE public.indicateur_periodicite;
COMMIT;
