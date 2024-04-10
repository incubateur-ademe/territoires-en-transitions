-- Verify tet:indicateur/global on pg

BEGIN;

SELECT type,
       collectivite_id,
       indicateur_id,
       indicateur_perso_id,
       annee,
       valeur,
       commentaire,
       source,
       source_id
from indicateurs
    where false;

ROLLBACK;
