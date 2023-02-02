-- Revert tet:retool/utilisateur from pg

BEGIN;

drop view retool_user_collectivites_list;
drop view retool_user_list;
drop function retool_user_list();

COMMIT;
