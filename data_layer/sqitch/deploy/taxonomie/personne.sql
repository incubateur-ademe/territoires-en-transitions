-- Deploy tet:taxonomie/personnes to pg

BEGIN;

create view private.personnes_collectivite
as
select pt.nom,
       pt.collectivite_id,
       pt.id      as tag_id,
       null::uuid as user_id
from personne_tag pt
union
select u.prenom || ' ' || u.nom,
       d.collectivite_id,
       null,
       d.user_id
from private_utilisateur_droit d
         join utilisateur.dcp_display u on u.user_id = d.user_id
where d.active;
comment on view private.personnes_collectivite
    is 'Les personnes par collectivité, utilisées pour tagger des fiches ou des indicateurs';

-- todo exposer une vue et supprimer la RPC.
create or replace function personnes_collectivite(
    collectivite_id integer
)
    returns setof personne
    language sql
    security definer
begin
    atomic
    select p.nom, p.collectivite_id, p.tag_id, p.user_id
    from private.personnes_collectivite p
    where can_read_acces_restreint(personnes_collectivite.collectivite_id)
      and p.collectivite_id = personnes_collectivite.collectivite_id;
end;

COMMIT;
