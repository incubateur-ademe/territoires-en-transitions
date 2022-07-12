-- Revert tet:utilisateur/membre from pg

BEGIN;


drop function collectivite_membres; 
drop function update_collectivite_membre_details_fonction; 
drop table membre_fonction; 
drop type membre_fonction; 

COMMIT;
