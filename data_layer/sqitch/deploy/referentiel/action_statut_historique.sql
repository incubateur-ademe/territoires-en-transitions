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
begin
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
    return new;
end;
$$ language plpgsql security definer;

create trigger save_history
    after insert or update
    on action_statut
    for each row
execute procedure historique.save_action_statut();

COMMIT;
