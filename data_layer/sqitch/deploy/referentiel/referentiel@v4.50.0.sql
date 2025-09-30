-- Deploy tet:referentiel/referentiel to pg

ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'exemple';
ALTER TYPE referentiel ADD VALUE IF NOT EXISTS 'te';
ALTER TYPE referentiel ADD VALUE IF NOT EXISTS 'te-test';

BEGIN;

-- Create the referentiels table. use referentiels instead of referentiel to avoid conflict with enum
create table IF NOT EXISTS referentiel_definition
(
    id              varchar(30) primary key,
    nom             varchar(300) not null,
    version         varchar(16) not null default '1.0.0', -- Semver
    hierarchie      action_type ARRAY NOT NULL,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at     timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table referentiel_definition is
    'Les référentiels de la plateforme';

alter table referentiel_definition enable row level security;
drop policy if exists allow_read on referentiel_definition;
create policy allow_read on referentiel_definition for select using(is_authenticated());

insert into referentiel_definition (id, nom, version, hierarchie) values 
('cae', 'Climat Air Énergie', '1.0.0', '{"referentiel", "axe", "sous-axe", "action", "sous-action", "tache"}'),
('eci', 'Économie Circulaire', '1.0.0', '{"referentiel", "axe", "action", "sous-action", "tache"}'),
('te', 'Transition Écologique', '0.1.0', '{"referentiel", "axe", "sous-axe", "action", "sous-action", "exemple"}'),
('te-test', 'Transition Écologique', '0.1.0', '{"referentiel", "axe", "sous-axe", "action", "sous-action", "exemple"}')
on conflict do nothing;

create or replace trigger set_modified_at
    before update
    on referentiel_definition
    for each row
execute procedure update_modified_at();

alter table action_definition add column if not exists referentiel_id varchar(30);

UPDATE action_definition
SET referentiel_id = referentiel::text;

ALTER TABLE action_definition
    ALTER COLUMN referentiel_id SET NOT NULL;

-- Referentiel version allows keeping track of action definitions which are not in the current version of the referentiel
alter table action_definition add column if not exists referentiel_version varchar(16);

UPDATE action_definition
SET referentiel_version = '1.0.0';

ALTER TABLE action_definition
    ALTER COLUMN referentiel_version SET NOT NULL;

ALTER TABLE "public"."action_definition"  DROP CONSTRAINT IF EXISTS "referentiel_id_fkey";
alter table "public"."action_definition" 
add constraint "referentiel_id_fkey"
foreign key ("referentiel_id") 
references "public"."referentiel_definition" ("id") 
on delete restrict;

create table IF NOT EXISTS referentiel_tag
(
    ref             varchar(300) primary key,
    nom             varchar(300) not null,
    type            varchar(300) not null -- Useful to group tags together, no need to create a table for that for now
);
comment on table referentiel_tag is
    'liste des tags associés aux actions des référentiels';

create table IF NOT EXISTS action_definition_tag
(   
    referentiel_id  varchar(30) references referentiel_definition not null,
    action_id       varchar(30) references action_relation not null,
    tag_ref         varchar(300) references referentiel_tag not null,
    CONSTRAINT "action_definition_tag_referentiel_id_action_id_tag_ref_unique" UNIQUE("referentiel_id", "action_id", "tag_ref")
);
comment on table action_definition_tag is
    'Association entre une action et un tag';

-- Update upsert_actions to add referentiel_id
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
            insert into action_definition (action_id, referentiel, referentiel_id, referentiel_version, identifiant, nom, description, contexte, exemples,
                                           ressources, reduction_potentiel, perimetre_evaluation, preuve, points,
                                           pourcentage, categorie)
            select action ->> 'action_id'::action_id,
                   (action ->> 'referentiel')::referentiel,
                   action ->> 'referentiel',
                   '1.0.0',
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

create table if not exists action_origine
(
    referentiel_id          varchar(30) references referentiel_definition not null, 
    action_id               varchar(30) references action_relation not null,
    origine_referentiel_id  varchar(30) references referentiel_definition not null,
    origine_action_id       varchar(30) references action_relation not null,
    ponderation             double precision default 1.0 not null,
    CONSTRAINT "action_origine_referentiel_id_action_id_origine_referentiel_id_origine_action_id_unique" UNIQUE("referentiel_id", "action_id", "origine_referentiel_id", "origine_action_id")
);
comment on table action_origine is
    'Lien entre une action du nouveau référentiel et les actions des anciens référentiels';

alter table action_origine enable row level security;
drop policy if exists allow_read on action_origine;
create policy allow_read on action_origine for select using(is_authenticated());


COMMIT;
