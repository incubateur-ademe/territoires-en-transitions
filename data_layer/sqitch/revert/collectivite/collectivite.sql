-- Deploy tet:collectivites to pg
-- requires: base
-- requires: imports

BEGIN;

drop function have_lecture_access_with_restreint;
alter table collectivite
    drop column access_restreint;

COMMIT;
