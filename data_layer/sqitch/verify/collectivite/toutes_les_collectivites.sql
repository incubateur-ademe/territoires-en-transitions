-- Verify tet:collectivite/toutes_les_collectivites on pg

BEGIN;

select has_function_privilege('vide(axe)', 'execute');
select has_function_privilege('collectivite_card(axe)', 'execute');
select has_function_privilege('active(collectivite)', 'execute');

ROLLBACK;
