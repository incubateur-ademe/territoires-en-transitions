-- Revert tet:indicateur/filtre from pg

BEGIN;

drop function thematiques(indicateur_definitions);
drop function axe(indicateur_definitions);
drop function pilote(indicateur_definitions);
drop function service(indicateur_definitions);
drop function definition_referentiel(indicateur_definitions);
drop function rempli(indicateur_definitions);
drop function enfants(indicateur_definitions);
drop function personne(indicateur_pilote);

COMMIT;
