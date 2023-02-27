-- Deploy tet:indicateur/json_content to pg

BEGIN;

create table indicateurs_json
(
    indicateurs jsonb       not null,
    created_at  timestamptz not null default now()
);
alter table indicateurs_json
    enable row level security;

create or replace function
    private.upsert_indicateurs(indicateurs jsonb)
    returns void
as
$$
declare
    indicateur jsonb;
begin
    for indicateur in select * from jsonb_array_elements(indicateurs)
        loop
            insert into indicateur_definition
            (id, indicateur_group, identifiant, valeur_indicateur, nom, description, unite, obligation_eci, parent)
            values ((indicateur ->> 'indicateur_id')::indicateur_id,
                    (indicateur ->> 'indicateur_group')::indicateur_group,
                    indicateur ->> 'identifiant',
                    (indicateur ->> 'valeur_indicateur')::indicateur_id,
                    indicateur ->> 'nom',
                    indicateur ->> 'description',
                    indicateur ->> 'unite',
                    (indicateur ->> 'obligation_eci')::bool,
                    null)
            on conflict (id) do update
                set indicateur_group  = excluded.indicateur_group,
                    identifiant       = excluded.identifiant,
                    valeur_indicateur = excluded.valeur_indicateur,
                    nom               = excluded.nom,
                    description       = excluded.description,
                    unite             = excluded.unite,
                    obligation_eci    = excluded.obligation_eci,
                    parent            = excluded.parent;

            -- les liens entre indicateur et action
            if indicateur -> 'action_ids' != 'null'
            then
                --- insert les liens
                insert into indicateur_action (indicateur_id, action_id)
                select indicateur ->> 'indicateur_id',
                       jsonb_array_elements_text(indicateur -> 'action_ids')::action_id
                on conflict (indicateur_id, action_id) do nothing;
                --- enlève les liens qui n'existent plus
                delete
                from indicateur_action ia
                where ia.indicateur_id = (indicateur ->> 'indicateur_id')::indicateur_id
                  and ia.action_id not in
                      (select id::action_id from jsonb_array_elements_text(indicateur -> 'action_ids') as id);
            end if;
        end loop;
end ;
$$ language plpgsql security definer;
comment on function private.upsert_indicateurs is
    'Mets à jour les définitions des indicateurs ansi que les liens avec les actions.';

-- Trigger pour mettre à jour le contenu suite à l'insertion de json.
create function
    private.upsert_indicateurs_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform private.upsert_indicateurs(new.indicateurs);
    return new;
end;
$$ language plpgsql;

create trigger after_indicateurs_json
    after insert
    on indicateurs_json
    for each row
execute procedure private.upsert_indicateurs_after_json_insert();

COMMIT;
