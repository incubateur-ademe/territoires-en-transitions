-- Deploy tet:referentiel/rename_te to pg

BEGIN;

update referentiel_definition
set nom='Climat Ressources'
where id in ('te', 'te-test');

update action_definition
set nom='Climat Ressources'
where action_id in ('te', 'te-test');

COMMIT;
