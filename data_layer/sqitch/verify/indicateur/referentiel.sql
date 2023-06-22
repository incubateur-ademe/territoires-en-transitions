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
       participation_score,
       titre_long,
       parent,
       source,
       type,
       thematiques,
       programmes
from indicateur_definition
where false;

select modified_at,
       collectivite_id,
       indicateur_id,
       commentaire,
       modified_by,
       annee
from indicateur_resultat_commentaire
where false;

ROLLBACK;
