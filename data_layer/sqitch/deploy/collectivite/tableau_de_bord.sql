-- Deploy tet:collectivite/tableau_de_bord_filtre to pg

BEGIN;

UPDATE tableau_de_bord_module
SET 
type = 'fiche-action.count-by',
options = jsonb_set(options, ARRAY ['countByProperty'],to_jsonb('statut'::text), true )
where type = 'fiche-action.count-by-status';

ALTER TABLE tableau_de_bord_module RENAME COLUMN slug TO default_key;

ALTER TABLE tableau_de_bord_module ALTER COLUMN default_key DROP NOT NULL;

COMMIT;
