-- Deploy tet:indicateur/periodicite_obligatoire to pg
-- requires: indicateur/remplacer-catalogue-periodicites-par-contraintes
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- L'activation retire la contrainte annuelle qui interdisait aussi NULL.
ALTER TABLE public.indicateur_definition ALTER COLUMN periodicite SET NOT NULL;
-- Deux cadences d'une source peuvent partager la même date : les anciens
-- index ne distinguent pas ces séries, contrairement aux index de #5220.
DROP INDEX public.unique_indicateur_valeur_utilisateur;
DROP INDEX public.unique_indicateur_valeur_importee;
COMMIT;
