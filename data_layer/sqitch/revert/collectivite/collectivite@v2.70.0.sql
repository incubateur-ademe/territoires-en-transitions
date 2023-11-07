-- Deploy tet:collectivites to pg
-- requires: base
-- requires: imports

BEGIN;

drop function can_read_acces_restreint;
alter table collectivite
    drop column access_restreint;

COMMIT;
