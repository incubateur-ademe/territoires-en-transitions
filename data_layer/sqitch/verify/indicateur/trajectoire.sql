-- Verify tet:indicateur/trajectoire on pg

BEGIN;

SELECT 1/COUNT(*) FROM groupement WHERE nom = 'trajectoire';

ROLLBACK;
