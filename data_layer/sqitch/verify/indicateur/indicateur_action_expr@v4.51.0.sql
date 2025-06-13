-- Verify tet:indicateur/indicateur_action_expr on pg

BEGIN;

select utilise_par_expr_score
from indicateur_action
where false;

ROLLBACK;
