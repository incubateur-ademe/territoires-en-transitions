-- Deploy tet:taxonomie/personnes to pg

BEGIN;

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
    where (can_read_acces_restreint(personnes_collectivite.collectivite_id)
               or is_service_role())
      and p.collectivite_id = personnes_collectivite.collectivite_id;
end;

COMMIT;
