-- Verify tet:referentiel/add_type_calcul_score on pg

BEGIN;

select type_calcul_score
from action_definition
where false;

ROLLBACK;
