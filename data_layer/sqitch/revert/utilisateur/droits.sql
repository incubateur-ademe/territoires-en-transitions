-- Revert tet:droits from pg

BEGIN;

drop view elses_collectivite;
drop view owned_collectivite;
drop view active_collectivite;

drop function is_agent_of(id integer);
drop function is_referent_of(id integer);
drop function is_role_on(role role_name, id integer);
drop function is_amongst_role_on(role_list role_name[], id integer);
drop function is_any_role_on(id integer);

drop table private_utilisateur_droit;
drop type role_name;

COMMIT;
