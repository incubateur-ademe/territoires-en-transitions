-- Deploy tet:referentiel/action_statut_history to pg
-- requires: referentiel/action_statut

BEGIN;

create function historique.action_statuts_at(
    collectivite_id int,
    referentiel referentiel,
    "time" timestamp with time zone
)
    returns setof historique.action_statut
begin
    atomic
    with latest as (select max(modified_at) as max, action_id
                    from historique.action_statut s
                             join action_relation ar on s.action_id = ar.id
                    where s.collectivite_id = action_statuts_at.collectivite_id
                      and ar.referentiel = action_statuts_at.referentiel
                      and s.modified_at <= action_statuts_at.time
                    group by action_id)
    select id,
           s.collectivite_id,
           s.action_id,
           avancement,
           previous_avancement,
           avancement_detaille,
           previous_avancement_detaille,
           concerne,
           previous_concerne,
           modified_by,
           previous_modified_by,
           modified_at,
           previous_modified_at
    from historique.action_statut s
             join latest l
                  on s.action_id = l.action_id
                      and s.modified_at = l.max
    where s.collectivite_id = action_statuts_at.collectivite_id;
end;
comment on function historique.action_statuts_at
    is 'Les statuts d''une collectivité à un moment donné.';

-- répare l'historisation
create or replace function historique.save_action_statut() returns trigger
as
$$
declare
    updated integer;
begin
    update historique.action_statut
    set avancement          = new.avancement,
        avancement_detaille = new.avancement_detaille,
        modified_at         = new.modified_at,
        concerne            = new.concerne -- le non concerné n'était pas historisé
    where id in (select id
                 from historique.action_statut
                 where collectivite_id = new.collectivite_id
                   and action_id = new.action_id
                   and modified_by = new.modified_by
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.action_statut
        values (default,
                new.collectivite_id,
                new.action_id,
                new.avancement,
                old.avancement,
                new.avancement_detaille,
                old.avancement_detaille,
                new.concerne,
                old.concerne,
                auth.uid(),
                old.modified_by,
                new.modified_at,
                old.modified_at);
    end if;
    return new;
end ;
$$ language plpgsql security definer;

COMMIT;
