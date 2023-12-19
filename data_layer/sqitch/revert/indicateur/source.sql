-- Revert tet:indicateur/source from pg

BEGIN;

drop function import_sources(indicateur_definitions);
alter table indicateur_resultat_import drop column source_id;
drop table indicateur_source;

COMMIT;
