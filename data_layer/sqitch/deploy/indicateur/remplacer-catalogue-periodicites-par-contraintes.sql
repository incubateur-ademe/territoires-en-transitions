-- Deploy tet:indicateur/remplacer-catalogue-periodicites-par-contraintes to pg
-- requires: indicateur/periodicite_schema

BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Le contrat reste strictement annuel ; les autres cadences seront ouvertes
-- par la migration d'activation. Aucune configuration SQL n'est lue par le backend.
ALTER TABLE public.indicateur_definition
    ADD CONSTRAINT indicateur_definition_periodicite_check
        CHECK (periodicite = 'annuelle'),
    DROP CONSTRAINT indicateur_definition_periodicite_fkey;
ALTER TABLE public.indicateur_valeur
    ADD CONSTRAINT indicateur_valeur_periodicite_check
        CHECK (periodicite = 'annuelle'),
    DROP CONSTRAINT indicateur_valeur_periodicite_fkey;

-- Sans CASCADE : une dépendance ajoutée ailleurs doit être traitée explicitement.
DROP TABLE public.indicateur_periodicite;
DROP FUNCTION public.empecher_modification_periodicite();
COMMIT;
