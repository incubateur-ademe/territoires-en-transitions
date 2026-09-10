-- Revert tet:indicateur/dependances_formules from pg

BEGIN;

DROP FUNCTION private.extraire_dependances_formule_indicateur(text);

COMMIT;
