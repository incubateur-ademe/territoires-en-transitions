-- Verify tet:referentiel on pg

BEGIN;

select modified_at,
       id,
       indicateur_group,
       identifiant,
       valeur_indicateur,
       nom,
       description,
       unite,
       obligation_eci,
       parent,
       valeur_seuil,
       valeur_cible
from indicateur_definition
where false;

ROLLBACK;
