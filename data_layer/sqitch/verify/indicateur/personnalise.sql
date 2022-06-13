-- Verify tet:indicateur/personnalise on pg

BEGIN;

select modified_at,
       id,
       collectivite_id,
       titre,
       description,
       unite,
       commentaire,
       modified_by
from indicateur_personnalise_definition
where false;

select modified_at, valeur, annee, collectivite_id, indicateur_id
from indicateur_personnalise_resultat
where false;

select modified_at, valeur, annee, collectivite_id, indicateur_id
from indicateur_personnalise_objectif
where false;

ROLLBACK;
