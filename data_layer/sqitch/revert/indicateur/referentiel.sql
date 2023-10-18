-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

drop table indicateur_service_tag;
drop table indicateur_pilote;


COMMIT;
