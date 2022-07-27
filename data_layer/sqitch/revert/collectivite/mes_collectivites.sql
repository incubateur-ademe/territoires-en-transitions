-- Revert tet:mes_collectivite from pg

BEGIN;

drop function remove_user_from_collectivite(collectivite_id integer, user_id uuid);
drop function collectivite_user_list(id integer);

COMMIT;
