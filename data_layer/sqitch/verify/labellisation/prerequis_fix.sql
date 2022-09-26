-- Verify tet:labellisation/prerequis_fix on pg

BEGIN;

-- Only the behavior of a function have changed, it cannot be verified independently of data.

ROLLBACK;
