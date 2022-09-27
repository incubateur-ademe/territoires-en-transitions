-- Deploy tet:referentiel/preuve_reglementaire to pg

BEGIN;

-- Les preuves réglementaires remplaçant les preuves dans les action
-- on enlève la contrainte not-null
alter table action_definition
    alter column preuve drop not null;

create domain preuve_id as varchar(50);
create table preuve_reglementaire_definition
(
    id          preuve_id primary key,
    nom         text not null,
    description text not null
);
comment on table preuve_reglementaire_definition is
    'Définition des preuve règlementaire liée à des actions';

create table preuve_action
(
    preuve_id preuve_id not null references preuve_reglementaire_definition,
    action_id action_id not null references action_relation,
    primary key (preuve_id, action_id)
);
comment on table preuve_action is
    'Les liens entre preuve et action.';
alter table preuve_action
    enable row level security;

alter table preuve_reglementaire_definition
    enable row level security;

create policy allow_read
    on preuve_reglementaire_definition
    for select
    using (true);

create or replace function labellisation.upsert_preuves_reglementaire(
    preuves jsonb
) returns void as
$$
declare
    preuve jsonb;
begin
    -- upsert le contenu
    for preuve in select * from jsonb_array_elements(preuves)
        loop
            -- la definition
            insert into preuve_reglementaire_definition (id, nom, description)
            select preuve ->> 'id',
                   preuve ->> 'nom',
                   preuve ->> 'description'
            on conflict (id) do update
                set nom         = excluded.nom,
                    description = excluded.description;

            -- les liens entre preuve et action
            --- insert les liens
            insert into preuve_action
            select preuve ->> 'id',
                   jsonb_array_elements_text(preuve -> 'actions')::action_id
            on conflict (preuve_id, action_id) do nothing;
            --- enlève les liens qui n'existent plus
            delete
            from preuve_action
            where preuve_id = (preuve ->> 'id')::preuve_id
              and action_id not in (select id::action_id from jsonb_array_elements_text(preuve -> 'actions') as id);
        end loop;
end
$$ language plpgsql;
comment on function labellisation.upsert_preuves_reglementaire is
    'Met à jour les définitions des preuves réglementaires et les liens vers les actions.';

-- Le stockage du json des preuves réglementaires.
create table preuve_reglementaire_json
(
    preuves    jsonb       not null,
    created_at timestamptz not null default now()
);
alter table preuve_reglementaire_json
    enable row level security;

-- Trigger pour mettre à jour le contenu suite à l'insertion de json.
create function
    labellisation.upsert_preuves_reglementaire_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform labellisation.upsert_preuves_reglementaire(new.preuves)
    from preuve_reglementaire_json prj;
    return new;
end;
$$ language plpgsql;

create trigger after_preuve_json
    after insert
    on preuve_reglementaire_json
    for each row
execute procedure labellisation.upsert_preuves_reglementaire_after_json_insert();

COMMIT;
