-- Deploy tet:stats/collectivite to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

alter view stats_active_real_collectivites rename to stats_real_collectivites;

create or replace view stats_real_collectivites
as
select *
from named_collectivite
where collectivite_id not in (select collectivite_id from collectivite_test);

COMMIT;
