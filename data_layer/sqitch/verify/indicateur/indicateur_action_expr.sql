-- Verify tet:indicateur/indicateur_action_expr on pg

BEGIN;

select *
from indicateur_action
where false;

ROLLBACK;
