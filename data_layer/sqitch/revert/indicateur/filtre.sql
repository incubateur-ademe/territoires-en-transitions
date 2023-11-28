-- Revert tet:indicateur/filtre from pg

BEGIN;

drop function thematiques(indicateur_definitions);
drop function axes(indicateur_definitions);
drop function fiches_non_classees(indicateur_definitions);
drop function pilotes(indicateur_definitions);
drop function services(indicateur_definitions);
drop function definition_referentiel(indicateur_definitions);
drop function definition_perso(indicateur_definitions);
drop function rempli(indicateur_definitions);
drop function private.rempli(integer, indicateur_id);
drop function private.rempli(integer);
drop function enfants(indicateur_definitions);
drop function enfants(indicateur_definition);
drop function personne(indicateur_pilote);
drop function indicateur_action(indicateur_definitions);

COMMIT;
