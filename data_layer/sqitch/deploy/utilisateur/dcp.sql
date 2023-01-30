-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

alter table dcp
    add primary key (user_id);
COMMIT;
