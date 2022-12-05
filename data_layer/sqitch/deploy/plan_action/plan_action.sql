-- Deploy tet:plan_action to pg

BEGIN;

drop trigger after_collectivite_insert on collectivite;
drop function after_collectivite_insert_default_plan();
drop table plan_action cascade;
drop trigger after_fiche_action_write on fiche_action;
drop function after_fiche_action_write_save_relationships();
drop function update_fiche_relationships(fiche_action_uid uuid, action_ids action_id[], indicateur_ids
    indicateur_id[], indicateur_personnalise_ids integer[]);
drop table fiche_action_indicateur_personnalise;
drop table fiche_action_indicateur;
drop table fiche_action_action;
drop table fiche_action cascade;
drop type fiche_action_avancement;

create type fiche_action_thematiques as enum(
    'Agriculture et alimentation',
    'Bâtiments',
    'Consommation responsable',
    'Déchets',
    'Développement économique',
    'Eau',
    'Forêts, biodiversité et espaces verts',
    'Formation, sensibilisation, communication',
    'Gestion, production et distribution de l’énergie',
    'Mobilité',
    'Organisation interne',
    'Partenariats et coopération',
    'Précarité énergétique',
    'Stratégie',
    'Tourisme',
    'Urbanisme et aménagement'
    );

create type fiche_action_piliers_eci as enum (
    'Approvisionnement durable',
    'Écoconception',
    'Écologie industrielle (et territoriale)',
    'Économie de la fonctionnalité',
    'Consommation responsable',
    'Allongement de la durée d’usage',
    'Recyclage'
    );

create type fiche_action_resultats_attendus as enum (
    'Adaptation au changement climatique',
    'Sensibilisation',
    'Réduction des polluants atmosphériques',
    'Réduction des émissions de gaz à effet de serre',
    'Sobriété énergétique',
    'Efficacité énergétique',
    'Développement des énergies renouvelables'
    );

create type fiche_action_cibles as enum(
    'Grand public et associations',
    'Autres collectivités du territoire',
    'Acteurs économiques'
    );

create type fiche_action_statuts as enum(
    'À venir',
    'En cours',
    'Réalisé',
    'En pause',
    'Abandonné'
    );

create type fiche_action_niveaux_priorite as enum(
    'Élevé',
    'Moyen',
    'Bas'
    );

-- Table fiche_action
create table fiche_action
(
    id                      serial primary key,
    titre                   varchar(300),
    description             varchar(20000),
    thematiques             fiche_action_thematiques[],
    piliers_eci             fiche_action_piliers_eci[],
    objectifs               varchar(10000),
    resultats_attendus      fiche_action_resultats_attendus[],
    cibles                  fiche_action_cibles[],
    ressources              varchar(10000),-- Moyens humains et techniques
    financements            text,
    budget_previsionnel     integer,-- TODO Budget prévisionnel (20 digits max+espaces)
    statut                  fiche_action_statuts,
    niveau_priorite         fiche_action_niveaux_priorite,
    date_debut              timestamp with time zone,
    date_fin_provisoire     timestamp with time zone,
    amelioration_continue   boolean,-- Action en amélioration continue, sans date de fin
    calendrier              varchar(10000),
    notes_complementaires   varchar(20000),
    maj_termine             boolean,-- Mise à jour de la fiche terminée
    collectivite_id         integer references collectivite not null
);

-- Table plan_action
create table plan_action(
                            id serial primary key,
                            nom text,
                            collectivite_id integer references collectivite not null,
                            parent integer references plan_action
);
create table fiche_action_plan_action(
                                         fiche_id integer references fiche_action not null,
                                         plan_id integer references plan_action not null,
                                         primary key (fiche_id, plan_id)
);

-- Structure table de tags
create table tags(
                     nom text not null,
                     collectivite_id integer references collectivite not null,
                     unique(nom, collectivite_id)
);
-- Partenaires (FicheActionTags)
create table partenaires_tags(
                                 id serial primary key,
                                 like tags including all
);
create table fiche_action_partenaires_tags(
                                              fiche_id integer references fiche_action not null,
                                              partenaires_tags_id integer references partenaires_tags not null,
                                              primary key (fiche_id, partenaires_tags_id)
);
-- Structure pilote (FicheActionTags)
create table structures_tags(
                                id serial primary key,
                                like tags including all
);
create table fiche_action_structures_tags(
                                             fiche_id integer references fiche_action not null,
                                             structures_tags_id integer references structures_tags not null,
                                             primary key (fiche_id, structures_tags_id)
);

-- Utilisateurs non enregistrés
create table users_tags(
                           id serial primary key,
                           like tags including all
);
-- Personne pilote (lien auth.users + tags)
create table fiche_action_pilotes(
    fiche_id integer references fiche_action not null,
    utilisateur uuid references auth.users,
    tags integer references users_tags,
    -- unique au lieu de primary key pour autoriser le null sur utilisateur ou tags
    unique(fiche_id, utilisateur, tags)
);
-- Elu.e référent.e (lien auth.users + tags)
create table fiche_action_referents(
    fiche_id integer references fiche_action not null,
    utilisateur uuid references auth.users,
    tags integer references users_tags,
    -- unique au lieu de primary key pour autoriser le null sur utilisateur ou tags
    unique(fiche_id, utilisateur, tags)
);
-- TODO Indicateurs liés
-- Actions liées
create table fiche_action_action(
                                    fiche_id integer references fiche_action not null,
                                    action_id action_id references action_relation not null,
                                    primary key (fiche_id, action_id)
);
-- Documents et liens (voir preuve)
create table annexes(
                        id        serial primary key,
                        like labellisation.preuve_base including all
);
create table fiche_action_annexes(
                                     fiche_id integer references fiche_action not null,
                                     annexe_id integer references annexes not null,
                                     primary key (fiche_id, annexe_id)
);

-- Modifie les partenaires d'une fiche
create function upsert_fiche_action_partenaires(
    fiche_action_id integer,
    partenaires integer[]
) returns void as $$
declare
    partenaire integer;
begin
    -- Empty before upsert
    delete from fiche_action_partenaires_tags where fiche_id = fiche_action_id;
    -- Create links
    foreach partenaire in array partenaires
        loop
            insert into fiche_action_partenaires_tags (fiche_id, partenaires_tags_id)
            values (fiche_action_id, partenaire);
        end loop;
end $$ language plpgsql;

-- Modifie les structures d'une fiche
create function upsert_fiche_action_structures(
    fiche_action_id integer,
    structures integer[]
) returns void as $$
declare
    structure integer;
begin
    -- Empty before upsert
    delete from fiche_action_structures_tags where fiche_id = fiche_action_id;
    -- Create links
    foreach structure in array structures
        loop
            insert into fiche_action_structures_tags (fiche_id, structures_tags_id)
            values (fiche_action_id, structure);
        end loop;
end $$ language plpgsql;

-- Modifie les pilotes d'une fiche
create function upsert_fiche_action_pilotes(
    fiche_action_id integer,
    pilotes_tag integer[],
    pilotes_user uuid[]
) returns void as $$
declare
    pilote_tag integer;
    pilote_user uuid;
begin
    -- Empty before upsert
    delete from fiche_action_pilotes where fiche_id = fiche_action_id;
    -- Create links
    foreach pilote_tag in array pilotes_tag
        loop
            insert into fiche_action_pilotes (fiche_id, utilisateur, tags)
            values (fiche_action_id, null, pilote_tag);
        end loop;
    foreach pilote_user in array pilotes_user
        loop
            insert into fiche_action_pilotes (fiche_id, utilisateur, tags)
            values (fiche_action_id, pilote_user, null);
        end loop;
end $$ language plpgsql;

-- Modifie les référents d'une fiche
create function upsert_fiche_action_referents(
    fiche_action_id integer,
    referents_tag integer[],
    referents_user uuid[]
) returns void as $$
declare
    referent_tag integer;
    referent_user uuid;
begin
    -- Empty before upsert
    delete from fiche_action_referents where fiche_id = fiche_action_id;
    -- Create links
    foreach referent_tag in array referents_tag
        loop
            insert into fiche_action_referents (fiche_id, utilisateur, tags)
            values (fiche_action_id, null, referent_tag);
        end loop;
    foreach referent_user in array referents_user
        loop
            insert into fiche_action_pilotes (fiche_id, utilisateur, tags)
            values (fiche_action_id, referent_user, null);
        end loop;
end $$ language plpgsql;

-- Modifie les annexes d'une fiche
create function upsert_fiche_action_annexes(
    fiche_action_id integer,
    annexes integer[]
) returns void as $$
declare
    annexe integer;
begin
    -- Empty before upsert
    delete from fiche_action_annexes where fiche_id = fiche_action_id;
    -- Create links
    foreach annexe in array annexes
        loop
            insert into fiche_action_annexes (fiche_id, annexe_id)
            values (fiche_action_id, annexe);
        end loop;
end $$ language plpgsql;

-- Modifie les plans d'actions d'une fiche
create function upsert_fiche_action_plan_action(
    fiche_action_id integer,
    plans_action integer[]
) returns void as $$
declare
    plan_action integer;
begin
    -- Empty before upsert
    delete from fiche_action_plan_action where fiche_id = fiche_action_id;
    -- Create links
    foreach plan_action in array plans_action
        loop
            insert into fiche_action_plan_action (fiche_id, plan_id)
            values (fiche_action_id, plan_action);
        end loop;
end $$ language plpgsql;

-- Modifie les actions d'une fiche
create function upsert_fiche_action_action(
    fiche_action_id integer,
    actions action_id[]
) returns void as $$
declare
    action action_id;
begin
    -- Empty before upsert
    delete from fiche_action_action where fiche_id = fiche_action_id;
    -- Create links
    foreach action in array actions
        loop
            insert into fiche_action_action (fiche_id, action_id)
            values (fiche_action_id, action);
        end loop;
end $$ language plpgsql;

-- Modifie les données liées à la fiche action
create function upsert_fiche_action_liens(
    fiche_action_id integer,
    partenaires integer[],
    structures integer[],
    pilotes_tags integer[],
    pilotes_users uuid[],
    referents_tags integer[],
    referents_users uuid[],
    annexes integer[],
    plans_action integer[],
    actions action_id[]
) returns void as $$
begin
    execute upsert_fiche_action_partenaires(fiche_action_id, partenaires);
    execute upsert_fiche_action_structures(fiche_action_id, structures);
    execute upsert_fiche_action_pilotes(fiche_action_id, pilotes_tags, pilotes_users);
    execute upsert_fiche_action_referents(fiche_action_id, referents_tags, referents_users);
    execute upsert_fiche_action_annexes(fiche_action_id, annexes);
    execute upsert_fiche_action_plan_action(fiche_action_id, plans_action);
    execute upsert_fiche_action_action(fiche_action_id, actions);
end $$ language plpgsql;


-- Vue listant les fiches actions et ses données liées
create view fiches_action as
select fa.*,
       p.partenaires,
       s.structures,
       pt.pilotes_tags,
       pu.pilotes_users,
       rt.referents_tags,
       ru.referents_users,
       anne.annexes,
       pla.plans_action,
       act.actions
from fiche_action fa
    -- partenaires
    left join lateral (
        select array_agg(to_json(pt.*)) as partenaires
        from partenaires_tags pt
        join fiche_action_partenaires_tags fapt on fapt.partenaires_tags_id = pt.id
        where fapt.fiche_id = fa.id
    ) as p on true
    -- structures
    left join lateral (
        select array_agg(to_json(st.*)) as structures
        from structures_tags st
        join fiche_action_structures_tags fast on fast.structures_tags_id = st.id
        where fast.fiche_id = fa.id
    ) as s on true
    -- pilotes tags
    left join lateral (
    select array_agg(to_json(ut.*)) as pilotes_tags
        from users_tags ut
        join fiche_action_pilotes fap on fap.tags = ut.id
        where fap.fiche_id = fa.id
    ) as pt on true
    -- pilotes users
    left join lateral (
        select array_agg(to_json(au.*)) as pilotes_users
        from auth.users au
        join fiche_action_pilotes fap on fap.utilisateur = au.id
        where fap.fiche_id = fa.id
    ) as pu on true
    -- referents tags
    left join lateral (
        select array_agg(to_json(ut.*)) as referents_tags
        from users_tags ut
        join fiche_action_referents far on far.tags = ut.id
        where far.fiche_id = fa.id
    ) as rt on true
    -- referents users
    left join lateral (
        select array_agg(to_json(au.*)) as referents_users
        from auth.users au
        join fiche_action_referents far on far.utilisateur = au.id
        where far.fiche_id = fa.id
    ) as ru on true
    -- annexes
    left join lateral (
        select array_agg(to_json(a.*)) as annexes
        from annexes a
        join fiche_action_annexes faa on faa.annexe_id = a.id
        where faa.fiche_id = fa.id
    ) as anne on true
    -- plans action
    left join lateral (
        select array_agg(to_json(pa.*)) as plans_action
        from plan_action pa
        join fiche_action_plan_action fapa on fapa.plan_id = pa.id
        where fapa.fiche_id = fa.id
    ) as pla on true
    -- plans action
    left join lateral (
        select array_agg(to_json(ar.*)) as actions
        from action_relation ar
        join fiche_action_action faa on faa.action_id = ar.id
        where faa.fiche_id = fa.id
    ) as act on true
    -- TODO indicateurs
    -- TODO fiches liées (à calculer dans la vue selon action et indicateurs?)
;


-- TODO droits
/*
alter table fiche_action enable row level security;
alter table plan_action enable row level security;
alter table fiche_action_plan_action enable row level security;
alter table tags enable row level security;
alter table partenaires_tags enable row level security;
alter table fiche_action_partenaires_tags enable row level security;
alter table structures_tags enable row level security;
alter table fiche_action_structures_tags enable row level security;
alter table users_tags enable row level security;
alter table fiche_action_pilotes enable row level security;
alter table fiche_action_referents enable row level security;
alter table fiche_action_action enable row level security;
alter table annexes enable row level security;
alter table fiche_action_annexes enable row level security;
 */

COMMIT;