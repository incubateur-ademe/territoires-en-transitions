-- Revert tet:http_extension from pg

BEGIN;

drop extension http;

COMMIT;
