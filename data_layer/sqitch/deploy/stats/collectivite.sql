-- Deploy tet:stats/collectivite to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

create view stats_real_collectivites
as
select *
from named_collectivite
where collectivite_id not in (select collectivite_id from collectivite_test);

COMMIT;
