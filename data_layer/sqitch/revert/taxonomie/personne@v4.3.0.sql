-- Revert tet:taxonomie/personnes from pg

BEGIN;

create or replace function personnes_collectivite(collectivite_id integer) returns SETOF personne
    language sql
as
$$
select *
from (select pt.nom,
             pt.collectivite_id,
             pt.id      as tag_id,
             null::uuid as user_id
      from personne_tag pt
      where pt.collectivite_id = personnes_collectivite.collectivite_id
      union
      select concat(cm.prenom, ' ', cm.nom) as nom,
             personnes_collectivite.collectivite_id,
             null::integer                  as tag_id,
             cm.user_id::uuid               as user_id
      from collectivite_membres(personnes_collectivite.collectivite_id) cm) req
where can_read_acces_restreint(req.collectivite_id);
$$;

drop view private.personnes_collectivite;

COMMIT;
