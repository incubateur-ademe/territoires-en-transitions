-- Revert tet:referentiel/rename_te from pg

BEGIN;

update referentiel_definition
set nom='Transition Écologique'
where id in ('te', 'te-test');

update action_definition
set nom='Transition Écologique'
where action_id in ('te', 'te-test');

COMMIT;
