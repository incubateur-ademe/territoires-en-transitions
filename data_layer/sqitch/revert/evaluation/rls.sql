-- Revert tet:evaluation/rls from pg

BEGIN;

-- We don't want to revert missing RLS.

COMMIT;
