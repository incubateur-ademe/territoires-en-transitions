-- Revert tet:utils/teapot from pg

BEGIN;

drop function teapot;

COMMIT;
