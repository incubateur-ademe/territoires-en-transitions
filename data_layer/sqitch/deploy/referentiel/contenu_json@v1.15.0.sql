-- Deploy tet:referentiel/action_definition to pg

BEGIN;

create table referentiel_json
(
    definitions jsonb       not null,
    children    jsonb       not null,
    created_at  timestamptz not null default now()
);
alter table referentiel_json
    enable row level security;


create or replace function
    private.upsert_actions(definitions jsonb, children jsonb)
    returns void
as
$$
declare
    action jsonb;
    parent  jsonb;
    child_id text;
begin
    -- upsert la hiérarchie des actions
    --- children est une liste de type action, enfants
    --- on la transforme en une liste enfant, parent
    for parent in select * from jsonb_array_elements(children)
        loop
            -- la racine du référentiel
            insert into action_relation (id, referentiel, parent)
            select (parent ->>  'referentiel')::action_id,
                   (parent ->>  'referentiel')::referentiel,
                   null
            on conflict do nothing;

            for child_id in select * from jsonb_array_elements_text(parent -> 'children')
                loop
                    -- la relation d'une action à son parent.
                    insert into action_relation (id, referentiel, parent)
                    select child_id::action_id,
                           (parent ->>  'referentiel')::referentiel,
                           (parent ->> 'action_id')::action_id
                    on conflict do nothing;
                end loop;
        end loop;

    -- upsert les contenus
    for action in select * from jsonb_array_elements(definitions)
        loop
            -- la définition de l'action.
            insert into action_definition (action_id, referentiel, identifiant, nom, description, contexte, exemples,
                                           ressources, reduction_potentiel, perimetre_evaluation, preuve, points,
                                           pourcentage, categorie)
            select action ->> 'action_id'::action_id,
                   (action ->> 'referentiel')::referentiel,
                   action ->> 'identifiant',
                   action ->> 'nom',
                   action ->> 'description',
                   action ->> 'contexte',
                   action ->> 'exemples',
                   action ->> 'ressources',
                   action ->> 'reduction_potentiel',
                   action ->> 'perimetre_evaluation',
                   '', -- le champ preuve est toujours vide, les preuves règlementaires l'ayant remplacé.
                   (action ->> 'md_points')::float,
                   (action ->> 'md_pourcentage')::float,
                   (action ->> 'categorie')::action_categorie
            on conflict (action_id) do update
                set referentiel          = excluded.referentiel,
                    identifiant          = excluded.identifiant,
                    nom                  = excluded.nom,
                    description          = excluded.description,
                    contexte             = excluded.contexte,
                    exemples             = excluded.exemples,
                    ressources           = excluded.ressources,
                    reduction_potentiel  = excluded.reduction_potentiel,
                    perimetre_evaluation = excluded.perimetre_evaluation,
                    preuve               = excluded.preuve,
                    points               = excluded.points,
                    pourcentage          = excluded.pourcentage,
                    categorie            = excluded.categorie;

            -- les points de l'action.
            insert into action_computed_points(action_id, value)
            select action ->> 'action_id',
                   (action ->> 'computed_points')::float
            on conflict (action_id)
                do update set value = excluded.value;
        end loop;
end;
$$ language plpgsql security definer;
comment on function private.upsert_actions is
    'Met à jour les définitions des définitions des actions qui constituent un référentiel.';


-- Trigger pour mettre à jour le contenu suite à l'insertion de json.
create function
    private.upsert_referentiel_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform private.upsert_actions(new.definitions, new.children);
    return new;
end;
$$ language plpgsql;

create trigger after_referentiel_json
    after insert
    on referentiel_json
    for each row
execute procedure private.upsert_referentiel_after_json_insert();

COMMIT;
