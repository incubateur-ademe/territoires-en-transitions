-- Deploy tet:referentiel/action_statut_history to pg
-- requires: referentiel/action_statut

BEGIN;

create table historique.action_statut
(
    id                           serial primary key,
    collectivite_id              integer,
    action_id                    action_id,
    avancement                   avancement,
    previous_avancement          avancement,
    avancement_detaille          numeric[],
    previous_avancement_detaille numeric[],
    concerne                     boolean,
    previous_concerne            boolean,
    modified_by                  uuid,
    previous_modified_by         uuid,
    modified_at                  timestamp with time zone,
    previous_modified_at         timestamp with time zone
);

alter table historique.action_statut
    enable row level security;


create function historique.save_action_statut() returns trigger
as
$$
declare
    updated integer;
begin
    update historique.action_statut
    set avancement                   = new.avancement,
        avancement_detaille          = new.avancement_detaille,
        modified_at                  = new.modified_at
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

create trigger save_history
    after insert or update
    on action_statut
    for each row
execute procedure historique.save_action_statut();

COMMIT;
