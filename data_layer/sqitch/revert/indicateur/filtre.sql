-- Revert tet:indicateur/filtre from pg

BEGIN;

drop function thematique(indicateur_definitions);
drop function axe(indicateur_definitions);
drop function pilote(indicateur_definitions);
drop function service(indicateur_definitions);
drop function definition_referentiel(indicateur_definitions);

COMMIT;
