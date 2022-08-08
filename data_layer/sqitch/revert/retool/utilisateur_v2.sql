-- Revert tet:retool/utilisateur_v2 from pg

BEGIN;

drop view retool_user_list;

COMMIT;
