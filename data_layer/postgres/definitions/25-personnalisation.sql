create type regle_type as enum ('score', 'desactivation', 'reduction');

create table personnalisation
(
    action_id   action_id primary key references action_relation,
    titre       text not null,
    description text not null
);
comment on table personnalisation is
    'How an action is personalized.';

create table personnalisation_regle
(
    action_id   action_id  not null references personnalisation,
    type        regle_type not null,
    formule     text       not null,
    description text       not null,
    primary key (action_id, type)
);
comment on table personnalisation_regle is
    'A règle to be used for score computation, relate to a personnalisation and an action.';


create or replace function business_upsert_personnalisations(
    personnalisations json[]
) returns void as
$$
declare
    obj json;
begin
    if true -- is_service_role()
    then
        -- loop over personnalisations
        foreach obj in array personnalisations
            loop

                insert into personnalisation (action_id, titre, description)
                values (obj ->> 'action_id',
                        obj ->> 'titre',
                        obj ->> 'description')
                on conflict (action_id) do update
                    set titre       = excluded.titre,
                        description = excluded.description;

                with regle as (
                    select r
                    from json_array_elements((obj ->> 'regles')::json) r
                )
                insert
                into personnalisation_regle (action_id, type, formule, description)
                select obj ->> 'action_id',
                       (r ->> 'type')::regle_type,
                       r ->> 'formule',
                       r ->> 'description'
                from regle r
                on conflict (action_id, type) do update
                    set formule     = excluded.formule,
                        description = excluded.description;
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;
