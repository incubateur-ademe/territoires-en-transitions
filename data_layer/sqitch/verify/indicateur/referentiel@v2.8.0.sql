-- Verify tet:indicateur/referentiel on pg

BEGIN;

select modified_at, valeur, annee
from abstract_any_indicateur_value
where false;

select modified_at, valeur, annee, collectivite_id, indicateur_id
from indicateur_resultat
where false;

select modified_at, valeur, annee, collectivite_id, indicateur_id
from indicateur_objectif
where false;

select modified_at, collectivite_id, indicateur_id, commentaire, modified_by
from indicateur_commentaire
where false;

ROLLBACK;
