-- Verify tet:indicateur/referentiel on pg

BEGIN;

select type,
       collectivite_id,
       indicateur_id,
       indicateur_perso_id,
       annee,
       valeur,
       commentaire,
       source
from indicateurs;

ROLLBACK;
