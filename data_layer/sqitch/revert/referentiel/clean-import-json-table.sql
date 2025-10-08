-- Revert tet:referentiel/clean-import-json-table from pg

BEGIN;

create table if not exists personnalisations_json
(
    questions  jsonb       not null,
    regles     jsonb       not null,
    created_at timestamptz not null default now()
);
alter table personnalisations_json
    enable row level security;

create or replace function private.upsert_questions(
    questions jsonb[]
) returns void as
$$
declare
    obj                  json;
    type                 question_type;
    types_concernes_null boolean;
    types_concernes_arr  text[];
begin
    -- loop over questions
    foreach obj in array questions
        loop
            type = obj ->> 'type';
            select (obj ->> 'types_collectivites_concernees') is null into types_concernes_null;

            if types_concernes_null
            then
                select null into types_concernes_arr;
            else
                select array(select json_array_elements_text((obj -> 'types_collectivites_concernees')))
                into
                    types_concernes_arr;
            end if;

            insert into question (id, thematique_id, type, description, ordonnancement, formulation,
                                  types_collectivites_concernees)
            values (obj ->> 'id',
                    obj ->> 'thematique_id',
                    (obj ->> 'type')::question_type,
                    obj ->> 'description',
                    (obj ->> 'ordonnancement')::integer,
                    obj ->> 'formulation',
                    types_concernes_arr)
            on conflict (id) do update
                -- we update the request fields, except for type.
                set thematique_id                  = excluded.thematique_id,
                    description                    = excluded.description,
                    formulation                    = excluded.formulation,
                    ordonnancement                 = excluded.ordonnancement,
                    types_collectivites_concernees = excluded.types_collectivites_concernees;

            with action_id as (select a
                               from json_array_elements_text((obj ->> 'action_ids')::json) a)
            insert
            into question_action (question_id, action_id)
            select obj ->> 'id',
                   a::action_id
            from action_id r
            on conflict do nothing;

            if type = 'choix'
            then
                with choix as (select c
                               from json_array_elements((obj ->> 'choix')::json) c)
                insert
                into question_choix (question_id, id, formulation, ordonnancement)
                select obj ->> 'id',
                       c ->> 'id',
                       c ->> 'formulation',
                       (c ->> 'ordonnancement')::integer
                from choix c
                on conflict (id) do update
                    -- we update only formulation and ordonnancement
                    set formulation    = excluded.formulation,
                        ordonnancement = excluded.ordonnancement;
            end if;
        end loop;
end
$$ language plpgsql security definer;


create function private.upsert_regles(
    regles jsonb[]
) returns void as
$$
declare
    regle json;
begin
    -- loop over règles
    foreach regle in array regles
        loop

            insert into personnalisation (action_id, titre, description)
            values (regle ->> 'action_id',
                    regle ->> 'titre',
                    regle ->> 'description')
            on conflict (action_id) do update
                set titre       = excluded.titre,
                    description = excluded.description;

            with regle as (select r
                           from json_array_elements((regle ->> 'regles')::json) r)
            insert
            into personnalisation_regle (action_id, type, formule, description)
            select regle ->> 'action_id',
                   (r ->> 'type')::regle_type,
                   r ->> 'formule',
                   r ->> 'description'
            from regle r
            on conflict (action_id, type) do update
                set formule     = excluded.formule,
                    description = excluded.description;
        end loop;
end
$$ language plpgsql security definer;


-- Trigger pour mettre à jour le contenu suite à l'insertion de json.
create function
    private.upsert_personnalisations_after_json_insert()
    returns trigger
as
$$
begin
    -- Ouvre le json pour extraire la liste de règles
    perform private.upsert_regles(array_agg(r))
    from jsonb_array_elements(new.regles) r;

    -- Ouvre le json pour extraire la liste de questions
    perform private.upsert_questions(array_agg(q))
    from jsonb_array_elements(new.questions) q;

    return new;
end;
$$ language plpgsql;

create trigger upsert_personnalisations
    after insert
    on personnalisations_json
    for each row
execute procedure private.upsert_personnalisations_after_json_insert();

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
