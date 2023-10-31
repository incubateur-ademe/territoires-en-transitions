-- Revert tet:indicateur/detail from pg

BEGIN;

drop function thematiques;
drop function pilotes;
drop function private.get_personne_tag(indicateur_personnalise_pilote);
drop function private.get_personne_tag(indicateur_pilote);
drop function services;
drop view indicateur_definitions;

COMMIT;
