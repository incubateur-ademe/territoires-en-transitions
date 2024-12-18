-- Deploy tet:collectivite/tableau_de_bord_filtre to pg

BEGIN;

UPDATE "public"."tableau_de_bord_module"
SET 
type = 'fiche-action.count-by-status',
options = options - 'countByProperty'
where type = 'fiche-action.count-by';

ALTER TABLE tableau_de_bord_module RENAME COLUMN default_key TO slug;

COMMIT;
