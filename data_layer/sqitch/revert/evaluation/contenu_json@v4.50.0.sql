-- Deploy tet:evaluation/contenu_json to pg

BEGIN;

-- on ne peut pas restaurer la version précédente de la fonction car
-- `type_collectivite` n'existe plus

COMMIT;
