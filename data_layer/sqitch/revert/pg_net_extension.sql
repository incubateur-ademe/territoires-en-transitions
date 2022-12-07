-- Revert tet:pg_net_extension from pg

BEGIN;

drop extension if exists pg_net;
drop schema if exists net;

COMMIT;
