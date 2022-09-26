-- Deploy tet:stats/collectivite to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

create or replace view stats_real_collectivites
as
select *
from active_collectivite ac
where collectivite_id not in (select collectivite_id from collectivite_test);

alter view stats_real_collectivites rename to stats_active_real_collectivites;

COMMIT;
