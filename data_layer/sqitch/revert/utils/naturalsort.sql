-- Revert tet:utils/naturalsort from pg

BEGIN;

drop function naturalsort(text);

COMMIT;
