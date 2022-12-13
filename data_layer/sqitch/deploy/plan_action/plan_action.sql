-- Deploy tet:plan_action to pg

BEGIN;
create type migration.fiche_action_avancement as enum ('pas_fait', 'fait', 'en_cours', 'non_renseigne');
create table migration.fiche_action as select * from public.fiche_action;
alter table migration.fiche_action drop column avancement;
alter table migration.fiche_action add column avancement  migration.fiche_action_avancement not null;
update migration.fiche_action m set avancement = (select p.avancement::text::migration.fiche_action_avancement
                                                  from public.fiche_action p
                                                  where p.uid = m.uid);
create table migration.fiche_action_action as select * from public.fiche_action_action;
create table migration.fiche_action_indicateur as select * from public.fiche_action_indicateur;
create table migration.fiche_action_indicateur_personnalise as select * from public.fiche_action_indicateur_personnalise;
create table migration.plan_action as select * from public.plan_action;


drop materialized view stats.collectivite_plan_action cascade;
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

-- Actions liées
create table fiche_action_action(
                                    fiche_id integer references fiche_action not null,
                                    action_id action_id references action_relation not null,
                                    primary key (fiche_id, action_id)
);

-- Indicateurs liées TODO à revoir avec les nouveaux indicateurs
create table fiche_action_indicateur(
                                        fiche_id integer references fiche_action not null,
                                        indicateur_id indicateur_id references indicateur_definition,
                                        primary key (fiche_id, indicateur_id)
);
create table fiche_action_indicateur_personnalise(
                                                     fiche_id integer references fiche_action not null,
                                                     indicateur_id integer references indicateur_personnalise_definition,
                                                     primary key (fiche_id, indicateur_id)
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

-- Modifie les indicateurs d'une fiche
create function upsert_fiche_action_indicateur(
    fiche_action_id integer,
    indicateurs indicateur_id[]
) returns void as $$
declare
    indicateur indicateur_id;
begin
    -- Empty before upsert
    delete from fiche_action_indicateur where fiche_id = fiche_action_id;
    -- Create links
    foreach indicateur in array indicateurs
        loop
            insert into fiche_action_indicateur (fiche_id, indicateur_id)
            values (fiche_action_id, indicateur);
        end loop;
end $$ language plpgsql;

-- Modifie les indicateurs d'une fiche
create function upsert_fiche_action_indicateur_personnalise(
    fiche_action_id integer,
    indicateurs integer[]
) returns void as $$
declare
    indicateur integer;
begin
    -- Empty before upsert
    delete from fiche_action_indicateur_personnalise where fiche_id = fiche_action_id;
    -- Create links
    foreach indicateur in array indicateurs
        loop
            insert into fiche_action_indicateur_personnalise (fiche_id, indicateur_id)
            values (fiche_action_id, indicateur);
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
    actions action_id[],
    indicateurs indicateur_id[],
    indicateurs_personnalise integer[]
) returns void as $$
begin
    execute upsert_fiche_action_partenaires(fiche_action_id, partenaires);
    execute upsert_fiche_action_structures(fiche_action_id, structures);
    execute upsert_fiche_action_pilotes(fiche_action_id, pilotes_tags, pilotes_users);
    execute upsert_fiche_action_referents(fiche_action_id, referents_tags, referents_users);
    execute upsert_fiche_action_annexes(fiche_action_id, annexes);
    execute upsert_fiche_action_plan_action(fiche_action_id, plans_action);
    execute upsert_fiche_action_action(fiche_action_id, actions);
    execute upsert_fiche_action_indicateur(fiche_action_id, indicateurs);
    execute upsert_fiche_action_indicateur_personnalise(fiche_action_id, indicateurs_personnalise);
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
       act.actions,
       ind.indicateurs,
       indper.indicateurs_personalise
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
    -- indicateurs
         left join lateral (
    select array_agg(to_json(ad.*)) as indicateurs
    from indicateur_definition ad
             join fiche_action_indicateur fai on fai.indicateur_id = ad.id
    where fai.fiche_id = fa.id
    ) as ind on true
    -- indicateurs personalise
         left join lateral (
    select array_agg(to_json(apd.*)) as indicateurs_personalise
    from indicateur_personnalise_definition apd
             join fiche_action_indicateur_personnalise faip on faip.indicateur_id = apd.id
    where faip.fiche_id = fa.id
    ) as indper on true
-- TODO fiches liées (à calculer dans la vue selon action et indicateurs?)
;

-- Fonction récursive pour afficher un plan d'action
create or replace function recursive_plan_action(pa_id integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_nom text; -- Nom du plan d'action courant
    id_loop integer; -- Indice pour parcourir une boucle
    enfants jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    fiches jsonb; -- Fiches actions du plan d'action courant
    to_return jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    fiches = to_jsonb((select array_agg(fa.*)
                       from fiches_action fa
                                join fiche_action_plan_action fapa on fa.id = fapa.fiche_id
                       where fapa.plan_id = pa_id)) ;
    pa_nom = (select nom from plan_action where id = pa_id);
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from plan_action pa
        where pa.parent = pa_id
        loop
            enfants[id_loop] = recursive_plan_action(pa_enfant_id);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('id', pa_id,
                                   'nom', pa_nom,
                                   'fiches', fiches,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql;
comment on function recursive_plan_action is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    ses fiches et ses plans d''actions enfants de manière récursive';

-- Droits
alter table fiche_action enable row level security;
create policy allow_read on fiche_action
    for select using(is_authenticated());
create policy allow_insert on fiche_action
    for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on fiche_action
    for update using(have_edition_acces(collectivite_id));

alter table plan_action enable row level security;
create policy allow_read on plan_action
    for select using(is_authenticated());
create policy allow_insert on plan_action
    for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on plan_action
    for update using(have_edition_acces(collectivite_id));

alter table fiche_action_plan_action enable row level security;
create policy allow_read on fiche_action_plan_action
    for select using(is_authenticated());
create policy allow_insert on fiche_action_plan_action
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_plan_action
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table tags enable row level security;

alter table partenaires_tags enable row level security;
create policy allow_read on partenaires_tags
    for select using(is_authenticated());
create policy allow_insert on partenaires_tags
    for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on partenaires_tags
    for update using(have_edition_acces(collectivite_id));

alter table fiche_action_partenaires_tags enable row level security;
create policy allow_read on fiche_action_partenaires_tags
    for select using(is_authenticated());
create policy allow_insert on fiche_action_partenaires_tags
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_partenaires_tags
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table structures_tags enable row level security;
create policy allow_read on structures_tags
    for select using(is_authenticated());
create policy allow_insert on structures_tags
    for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on structures_tags
    for update using(have_edition_acces(collectivite_id));

alter table fiche_action_structures_tags enable row level security;
create policy allow_read on fiche_action_structures_tags
    for select using(is_authenticated());
create policy allow_insert on fiche_action_structures_tags
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_structures_tags
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table users_tags enable row level security;
create policy allow_read on users_tags
    for select using(is_authenticated());
create policy allow_insert on users_tags
    for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on users_tags
    for update using(have_edition_acces(collectivite_id));

alter table fiche_action_pilotes enable row level security;
create policy allow_read on fiche_action_pilotes
    for select using(is_authenticated());
create policy allow_insert on fiche_action_pilotes
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_pilotes
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table fiche_action_referents enable row level security;
create policy allow_read on fiche_action_referents
    for select using(is_authenticated());
create policy allow_insert on fiche_action_referents
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_referents
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table fiche_action_action enable row level security;
create policy allow_read on fiche_action_action
    for select using(is_authenticated());
create policy allow_insert on fiche_action_action
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_action
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table fiche_action_indicateur enable row level security;
create policy allow_read on fiche_action_indicateur
    for select using(is_authenticated());
create policy allow_insert on fiche_action_indicateur
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_indicateur
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table fiche_action_indicateur_personnalise enable row level security;
create policy allow_read on fiche_action_indicateur_personnalise
    for select using(is_authenticated());
create policy allow_insert on fiche_action_indicateur_personnalise
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_indicateur_personnalise
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

alter table annexes enable row level security;
create policy allow_read on annexes
    for select using(is_authenticated());
create policy allow_insert on annexes
    for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on annexes
    for update using(have_edition_acces(collectivite_id));

alter table fiche_action_annexes enable row level security;
create policy allow_read on fiche_action_annexes
    for select using(is_authenticated());
create policy allow_insert on fiche_action_annexes
    for insert with check(have_edition_acces((select fa.collectivite_id
                                              from fiche_action fa
                                              where fa.id = fiche_id
                                              limit 1)));
create policy allow_update on fiche_action_annexes
    for update using(have_edition_acces((select fa.collectivite_id
                                         from fiche_action fa
                                         where fa.id = fiche_id
                                         limit 1)));

/*
-- Transfert donnees
do $$
    declare
        mpa migration.plan_action;
        mfa migration.fiche_action;
        id_loop_pa integer;
        id_loop_fa integer;
        st fiche_action_statuts;
        part_ids integer[];
        stru_ids integer[];
        refe_ids integer[];
    begin
        id_loop_pa = 1;
        for mpa in select * from migration.plan_action
            loop
            -- TODO récupérer categories en tant que plan_action enfant et les fiches liées au catégories
                insert into plan_action (id, nom, collectivite_id, parent)
                values (id_loop_pa, mpa.nom, mpa.collectivite_id, null);
                id_loop_pa = id_loop_pa + 1;
            end loop;

        id_loop_fa = 1;
        for mfa in select * from migration.fiche_action
            loop
                --Transforme fiche_action_avancement en fiche_action_statuts
                st = (
                    select case
                               when mfa.avancement = 'pas_fait'::migration.fiche_action_avancement
                                   then 'À venir'::public.fiche_action_statuts
                               when mfa.avancement = 'fait'::migration.fiche_action_avancement
                                   then 'Réalisé'::public.fiche_action_statuts
                               when mfa.avancement = 'en_cours'::migration.fiche_action_avancement
                                   then 'En cours'::public.fiche_action_statuts
                               when mfa.avancement = 'non_renseigne'::migration.fiche_action_avancement
                                   then 'En pause'::public.fiche_action_statuts
                               end as st
                );
                -- Fiche action
                insert into public.fiche_action(id, titre, description, budget_previsionnel, statut, amelioration_continue, collectivite_id)
                values(id_loop_fa, mfa.titre, mfa.description, mfa.budget_global, mfa.date_fin is null, mfa.collectivite_id);

                -- Structures
                insert into structures_tags (nom, collectivite_id)
                values(mfa.structure_pilote, mfa.collectivite_id)
                on conflict do nothing;
                stru_ids = (select array_agg(t.id)
                            from structures_tags t
                            where t.nom = mfa.structure_pilote
                              and t.collectivite_id = mfa.collectivite_id);

                -- Referents
                insert into users_tags (nom, collectivite_id)
                values(mfa.elu_referent, mfa.collectivite_id),
                      (mfa.personne_referente, mfa.collectivite_id)
                on conflict do nothing;
                refe_ids =(select array_agg(t.id)
                           from users_tags t
                           where (t.nom = mfa.elu_referent or t.nom = mfa.personne_referente)
                             and t.collectivite_id = mfa.collectivite_id);

                -- Partenaires
                insert into partenaires_tags (nom, collectivite_id)
                values(mfa.partenaires, mfa.collectivite_id)
                on conflict do nothing;
                part_ids =(select array_agg(t.id)
                           from partenaires_tags t
                           where t.nom = mfa.partenaires
                             and t.collectivite_id = mfa.collectivite_id);

                -- Plan action
                select * from migration.fiche_action_

                select upsert_fiche_action_liens(
                               id_loop_fa,
                               part_ids,
                               stru_ids,
                               array[]::integer[],
                               array[]::uuid[],
                               refe_ids,
                               array[]::uuid[],
                               array[]::integer[],
                               array []::integer[],
                               mfa.action_ids,
                               mfa.indicateur_ids,
                               mfa.indicateur_personnalise_ids
                           );

                id_loop_fa = id_loop_fa +1;
            end loop;
    end
$$;
 */

create materialized view stats.collectivite_plan_action
as
with fa as (select collectivite_id,
                   count(*) as count
            from fiche_action f
            group by f.collectivite_id),
     pa as (select collectivite_id,
                   count(*) as count
            from plan_action p
            where p.parent is null
            group by p.collectivite_id)
select c.*,
       coalesce(fa.count, 0) as fiches,
       coalesce(pa.count, 0) as plans
from stats.collectivite c
         left join pa on pa.collectivite_id = c.collectivite_id
         left join fa on pa.collectivite_id = fa.collectivite_id
order by fiches desc;

COMMIT;