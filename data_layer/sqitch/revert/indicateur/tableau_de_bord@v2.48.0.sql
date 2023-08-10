-- Revert tet:indicateur/tableau_de_bord from pg

BEGIN;

drop view indicateur_summary;

COMMIT;
