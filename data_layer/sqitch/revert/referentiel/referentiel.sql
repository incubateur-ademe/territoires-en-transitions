-- Revert tet:referentiel/referentiel from pg

BEGIN;

alter table action_definition drop column if exists referentiel_id;

drop table referentiel_definition;

COMMIT;
