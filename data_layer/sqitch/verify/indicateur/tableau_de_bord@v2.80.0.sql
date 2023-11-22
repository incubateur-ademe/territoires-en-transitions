-- Verify tet:indicateur/tableau_de_bord on pg

BEGIN;

select collectivite_id, indicateur_id, programmes, resultats
from indicateur_summary
where false;

ROLLBACK;
