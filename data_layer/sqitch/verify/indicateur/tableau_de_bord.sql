-- Verify tet:indicateur/tableau_de_bord on pg

BEGIN;

select collectivite_id, categorie, nombre, rempli
from indicateur_summary
where false;

ROLLBACK;
