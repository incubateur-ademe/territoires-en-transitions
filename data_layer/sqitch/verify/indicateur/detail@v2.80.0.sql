-- Verify tet:indicateur/detail on pg

BEGIN;

select collectivite_id, indicateur_id, indicateur_perso_id, nom, description, unite
from indicateur_definitions
where false;

select has_function_privilege('services(indicateur_definitions)', 'execute');
select has_function_privilege('pilotes(indicateur_definitions)', 'execute');
select has_function_privilege('thematiques(indicateur_definitions)', 'execute');
select has_function_privilege('private.get_personne(indicateur_pilote)', 'execute');
select has_function_privilege('private.get_personne(indicateur_personnalise_pilote)', 'execute');

ROLLBACK;
