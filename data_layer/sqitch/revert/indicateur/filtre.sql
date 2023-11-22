-- Revert tet:indicateur/filtre from pg

BEGIN;

drop function thematiques(indicateur_definitions);
drop function axes(indicateur_definitions);
drop function pilotes(indicateur_definitions);
drop function services(indicateur_definitions);
drop function definition_referentiel(indicateur_definitions);
drop function rempli(indicateur_definitions);
drop function enfants(indicateur_definitions);
drop function personne(indicateur_pilote);
drop function action_ids(indicateur_definitions);
drop function action_ids(indicateur_definition);

COMMIT;
