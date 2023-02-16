-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

alter table dcp
    drop constraint dcp_pkey;

COMMIT;
