-- Deploy tet:indicateur/personnalise to pg

BEGIN;

drop table indicateur_personnalise_thematique;
drop table indicateur_personnalise_service_tag;
drop table indicateur_personnalise_pilote;
drop function private.indicateur_personnalise_collectivite_id;

COMMIT;
