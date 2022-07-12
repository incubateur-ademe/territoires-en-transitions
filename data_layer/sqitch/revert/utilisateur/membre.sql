-- Revert tet:utilisateur/membre from pg

BEGIN;


drop function collectivite_membres; 
drop function update_collectivite_membre_details_fonction; 
drop function update_collectivite_membre_fonction; 
drop function update_collectivite_membre_champ_intervention; 
drop table private_collectivite_membre; 
drop type membre_fonction; 

COMMIT;
