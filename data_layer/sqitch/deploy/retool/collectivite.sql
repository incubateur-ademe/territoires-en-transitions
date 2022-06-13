-- Deploy tet:retool/collectivite to pg

BEGIN;

create view retool_active_collectivite
as
select c.collectivite_id,
       nom
from named_collectivite c
where collectivite_id in (select collectivite_id from private_utilisateur_droit where active)
  and collectivite_id not in (select collectivite_id from collectivite_test)
order by nom;
comment on view retool_active_collectivite is
    'Active collectivités as defined by métier.';

COMMIT;
