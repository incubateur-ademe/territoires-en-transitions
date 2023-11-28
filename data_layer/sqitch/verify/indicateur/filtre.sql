-- Verify tet:indicateur/filtre on pg

BEGIN;

select has_function_privilege('thematiques(indicateur_definitions)', 'execute');
select has_function_privilege('thematiques(indicateur_definitions)', 'execute');
select has_function_privilege('axes(indicateur_definitions)', 'execute');
select has_function_privilege('fiches_non_classees(indicateur_definitions)', 'execute');
select has_function_privilege('pilotes(indicateur_definitions)', 'execute');
select has_function_privilege('services(indicateur_definitions)', 'execute');
select has_function_privilege('definition_referentiel(indicateur_definitions)', 'execute');
select has_function_privilege('definition_perso(indicateur_definitions)', 'execute');
select has_function_privilege('rempli(indicateur_definitions)', 'execute');
select has_function_privilege('enfants(indicateur_definitions)', 'execute');
select has_function_privilege('personne(indicateur_pilote)', 'execute');

ROLLBACK;
