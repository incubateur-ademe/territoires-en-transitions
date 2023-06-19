-- Verify tet:indicateur/referentiel on pg

BEGIN;

select modified_at,
       id,
       groupe,
       identifiant,
       valeur_indicateur,
       nom,
       description,
       unite,
       obligation_eci,
       participation_score,
       titre_long,
       parent,
       source,
       type
from indicateur_definition
where false;

ROLLBACK;
