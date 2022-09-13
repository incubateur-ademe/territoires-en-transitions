-- Deploy tet:referentiel/preuve_reglementaire to pg

BEGIN;

-- Les preuves réglementaires remplaçant les preuves dans les action
-- on enlève la contrainte not-null
alter table action_definition
    alter column preuve drop not null;

create domain preuve_id as varchar(50);
create table preuve_reglementaire_definition
(
    id              preuve_id primary key,
    action_id       action_id references action_relation,
    nom             text not null,
    description     text not null

);
comment on table preuve_reglementaire_definition is
    'Définition des preuve règlementaire liée à des actions';

alter table preuve_reglementaire_definition
    enable row level security;

create policy allow_read
    on preuve_reglementaire_definition
    for select
    using (true);

create function business_upsert_preuves(
    preuve_definitions preuve_reglementaire_definition[]
) returns void as
$$
declare
    def preuve_reglementaire_definition;
begin
    if is_service_role()
    then
        -- upsert definitions
        foreach def in array business_upsert_preuves.preuve_definitions
            loop
                insert into preuve_reglementaire_definition
                values (
                           def.id,
                           def.action_id,
                           def.nom,
                           def.description)
                on conflict (id)
                    do update set action_id  = def.action_id,
                                  nom       = def.nom,
                                  description       = def.description;
                -- delete old definitions
                delete
                from preuve_reglementaire_definition
                where id = def.id;
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;
comment on function business_upsert_preuves is
    'Met à jour les définitions des preuves réglementaires';

COMMIT;
