-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

drop function accepter_cgu;
alter table dcp
    drop column cgu_acceptees_le;

COMMIT;
