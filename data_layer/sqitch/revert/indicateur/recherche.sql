-- Revert tet:indicateur/recherche from pg

BEGIN;

drop index indicateur_personnalise_definition_fts;
drop index indicateur_personnalise_definition_collectivite;
drop index indicateur_definition_fts;

drop function
    cherchable(indicateur_definition);
drop function
    cherchable(indicateur_personnalise_definition);
drop function
    cherchable(indicateur_definitions);

COMMIT;
