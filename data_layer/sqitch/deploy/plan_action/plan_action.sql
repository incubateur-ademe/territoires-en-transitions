-- Deploy tet:plan_action to pg

BEGIN;
create type migration.fiche_action_avancement as enum ('pas_fait', 'fait', 'en_cours', 'non_renseigne');
create table migration.fiche_action as select * from public.fiche_action;
alter table migration.fiche_action drop column avancement;
alter table migration.fiche_action add column avancement  migration.fiche_action_avancement;
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

-- TAG
create table tag -- table abstraite
(
    nom text not null,
    collectivite_id integer references collectivite not null,
    unique(nom, collectivite_id)
);
alter table tag enable row level security;

-- FICHE ACTION
create table fiche_action
(
    id                      serial primary key,
    titre                   varchar(300),
    description             varchar(20000),
    thematiques             fiche_action_thematiques[],
    sous_thematiques        fiche_action_thematiques[],
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
alter table fiche_action enable row level security;
create policy allow_read on fiche_action for select using(is_authenticated());
create policy allow_insert on fiche_action for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on fiche_action for update using(have_edition_acces(collectivite_id));
create policy allow_delete on fiche_action for delete using(have_edition_acces(collectivite_id));

create function peut_modifier_la_fiche(id_fiche integer) returns boolean as $$
begin
    return have_edition_acces((select fa.collectivite_id from fiche_action fa where fa.id = id_fiche limit 1));
end;
$$language plpgsql;

-- AXE
create table axe
(
    id serial primary key,
    nom text,
    collectivite_id integer references collectivite not null,
    parent integer references axe
);
alter table axe enable row level security;
create policy allow_read on axe for select using(is_authenticated());
create policy allow_insert on axe for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on axe for update using(have_edition_acces(collectivite_id));
create policy allow_delete on axe for delete using(have_edition_acces(collectivite_id));

create table fiche_action_axe
(
    fiche_id integer references fiche_action not null,
    axe_id integer references axe not null,
    primary key (fiche_id, axe_id)
);
alter table fiche_action_axe enable row level security;
create policy allow_read on fiche_action_axe for select using(is_authenticated());
create policy allow_insert on fiche_action_axe for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_axe for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_axe for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_fiche_action_dans_un_axe(
    id_fiche integer,
    id_axe integer
) returns void as $$
begin
    insert into fiche_action_axe
    values (id_fiche, id_axe);
end;
$$ language plpgsql;
comment on function ajouter_fiche_action_dans_un_axe is 'Ajouter une fiche action dans un axe';

create function enlever_fiche_action_d_un_axe(
    id_fiche integer,
    id_axe integer
) returns void as $$
begin
    delete from fiche_action_axe
    where fiche_id = id_fiche and axe_id = id_axe;
end;
$$ language plpgsql;
comment on function enlever_fiche_action_d_un_axe is 'Enlever une fiche action d''un axe';

create function plans_action_collectivite(
    id_collectivite integer
) returns setof axe as $$
select axe.*
from axe
where axe.collectivite_id = id_collectivite
  and axe.parent = null;
$$ language sql;
comment on function plans_action_collectivite is 'Liste les plans action d''une collectivite';


-- PARTENAIRE
create table partenaire_tag
(
    id serial primary key,
    like tag including all
);
alter table partenaire_tag enable row level security;
create policy allow_read on partenaire_tag for select using(is_authenticated());
create policy allow_insert on partenaire_tag for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on partenaire_tag for update using(have_edition_acces(collectivite_id));
create policy allow_delete on partenaire_tag for delete using(have_edition_acces(collectivite_id));

create table fiche_action_partenaire_tag(
                                            fiche_id integer references fiche_action not null,
                                            partenaire_tag_id integer references partenaire_tag not null,
                                            primary key (fiche_id, partenaire_tag_id)
);
alter table fiche_action_partenaire_tag enable row level security;
create policy allow_read on fiche_action_partenaire_tag for select using(is_authenticated());
create policy allow_insert on fiche_action_partenaire_tag for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_partenaire_tag for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_partenaire_tag for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_partenaire(
    id_fiche integer,
    partenaire partenaire_tag
) returns partenaire_tag as $$
declare
    id_tag integer;
begin
        insert into partenaire_tag (nom, collectivite_id)
        values(partenaire.nom, partenaire.collectivite_id)
        on conflict (nom, collectivite_id) do update set nom = partenaire.nom
        returning id into id_tag;
        partenaire.id = id_tag;
    insert into fiche_action_partenaire_tag
    values (id_fiche, id_tag);
    return partenaire;
end;
$$ language plpgsql;
comment on function ajouter_partenaire is 'Ajouter un partenaire à la fiche';

create function enlever_partenaire(
    id_fiche integer,
    partenaire partenaire_tag
) returns void as $$
begin
    delete from fiche_action_partenaire_tag
    where fiche_id = id_fiche and partenaire_tag_id = partenaire.id;
end;
$$ language plpgsql;
comment on function enlever_partenaire is 'Enlever un partenaire à la fiche';

-- STRUCTURE PILOTE
create table structure_tag
(
    id serial primary key,
    like tag including all
);
alter table structure_tag enable row level security;
create policy allow_read on structure_tag for select using(is_authenticated());
create policy allow_insert on structure_tag for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on structure_tag for update using(have_edition_acces(collectivite_id));
create policy allow_delete on structure_tag for delete using(have_edition_acces(collectivite_id));

create table fiche_action_structure_tag
(
    fiche_id integer references fiche_action not null,
    structure_tag_id integer references structure_tag not null,
    primary key (fiche_id, structure_tag_id)
);
alter table fiche_action_structure_tag enable row level security;
create policy allow_read on fiche_action_structure_tag for select using(is_authenticated());
create policy allow_insert on fiche_action_structure_tag for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_structure_tag for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_structure_tag for delete using(peut_modifier_la_fiche(fiche_id));

create or replace function ajouter_structure(
    id_fiche integer,
    structure structure_tag
) returns structure_tag as $$
declare
    id_tag integer;
begin
    insert into structure_tag (nom, collectivite_id)
    values (structure.nom, structure.collectivite_id)
    on conflict (nom, collectivite_id) do update set nom = structure.nom
    returning id into id_tag;
    structure.id = id_tag;
    insert into fiche_action_structure_tag
    values (id_fiche, id_tag);
    return structure;
end;
$$ language plpgsql;
comment on function ajouter_structure is 'Ajouter une structure à la fiche';

create function enlever_structure(
    id_fiche integer,
    structure structure_tag
) returns void as $$
begin
    delete from fiche_action_structure_tag
    where fiche_id = id_fiche and structure_tag_id = structure.id;
end;
$$ language plpgsql;
comment on function enlever_structure is 'Enlever une structure à la fiche';

-- PERSONNE
create table personne_tag
(
    id serial primary key,
    like tag including all
);
alter table personne_tag enable row level security;
create policy allow_read on personne_tag for select using(is_authenticated());
create policy allow_insert on personne_tag for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on personne_tag for update using(have_edition_acces(collectivite_id));
create policy allow_delete on personne_tag for delete using(have_edition_acces(collectivite_id));

create type personne as
(
    nom text,
    collectivite_id integer,
    personne_tag_id integer,
    utilisateur_uuid uuid
);

create function personnes_collectivite(
    id_collectivite integer
) returns setof personne as $$
select
    pt.nom,
    pt.collectivite_id,
    pt.id as personne_tag_id,
    null::uuid as utilisateur_uuid
from personne_tag pt
where pt.collectivite_id = id_collectivite
union
select
    concat(cm.prenom, ' ', cm.nom) as nom,
    id_collectivite as collectivite_id,
    null::integer as personne_tag_id,
    cm.user_id::uuid as utilisateur_uuid
from collectivite_membres(id_collectivite) cm;
$$ language sql;
comment on function personnes_collectivite is 'Liste les personnes (tags et utilisateurs) d''une collectivite';

-- PERSONNE PILOTE
create table fiche_action_pilote
(
    fiche_id integer references fiche_action not null,
    utilisateur_uuid uuid references auth.users,
    personne_tag_id integer references personne_tag,
    -- unique au lieu de primary key pour autoriser le null sur utilisateur ou tags
    unique(fiche_id, utilisateur_uuid, personne_tag_id)
);
alter table fiche_action_pilote enable row level security;
create policy allow_read on fiche_action_pilote for select using(is_authenticated());
create policy allow_insert on fiche_action_pilote for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_pilote for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_pilote for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_pilote(
    id_fiche integer,
    pilote personne
) returns personne as $$
declare
    id_tag integer;
begin
    if pilote.utilisateur_uuid is null then
            insert into personne_tag (nom, collectivite_id)
            values (pilote.nom,  pilote.collectivite_id)
            on conflict (nom, collectivite_id) do update set nom = pilote.nom
            returning id into id_tag;
            pilote.personne_tag_id = id_tag;
        insert into fiche_action_pilote (fiche_id, utilisateur_uuid, personne_tag_id)
        values (id_fiche, null, id_tag);
    else
        insert into fiche_action_pilote (fiche_id, utilisateur_uuid, personne_tag_id)
        values (id_fiche, pilote.utilisateur_uuid, null);
    end if;
    return pilote;
end;
$$ language plpgsql;
comment on function ajouter_pilote is 'Ajouter un pilote à la fiche';

create function enlever_pilote(
    id_fiche integer,
    pilote personne
) returns void as $$
begin
    if pilote.utilisateur_uuid is null then
        delete from fiche_action_pilote
        where fiche_id = id_fiche and personne_tag_id = pilote.personne_tag_id;
    else
        delete from fiche_action_pilote
        where fiche_id = id_fiche and utilisateur_uuid = pilote.utilisateur_uuid;
    end if;

end;
$$ language plpgsql;
comment on function enlever_pilote is 'Enlever un pilote à la fiche';

-- REFERENT
create table fiche_action_referent
(
    fiche_id integer references fiche_action not null,
    utilisateur_uuid uuid references auth.users,
    personne_tag_id integer references personne_tag,
    -- unique au lieu de primary key pour autoriser le null sur utilisateur ou tag
    unique(fiche_id, utilisateur_uuid, personne_tag_id)
);
alter table fiche_action_referent enable row level security;
create policy allow_read on fiche_action_referent for select using(is_authenticated());
create policy allow_insert on fiche_action_referent for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_referent for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_referent for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_referent(
    id_fiche integer,
    referent personne
) returns personne as $$
declare
    id_tag integer;
begin
    if referent.utilisateur_uuid is null then
        id_tag = referent.personne_tag_id;
        if id_tag is null then
            insert into personne_tag (nom, collectivite_id)
            values (referent.nom,  referent.collectivite_id)
            returning id into id_tag;
            referent.personne_tag_id = id_tag;
        end if;
        insert into fiche_action_referent (fiche_id, utilisateur_uuid, personne_tag_id)
        values (id_fiche, null, id_tag);
    else
        insert into fiche_action_referent (fiche_id, utilisateur_uuid, personne_tag_id)
        values (id_fiche, referent.utilisateur_uuid, null);
    end if;
    return referent;
end;
$$ language plpgsql;
comment on function ajouter_referent is 'Ajouter un referent à la fiche';

create function enlever_referent(
    id_fiche integer,
    referent personne
) returns void as $$
begin
    if referent.utilisateur_uuid is null then
        delete from fiche_action_referent
        where fiche_id = id_fiche and personne_tag_id = referent.personne_tag_id;
    else
        delete from fiche_action_referent
        where fiche_id = id_fiche and utilisateur_uuid = referent.utilisateur_uuid;
    end if;

end;
$$ language plpgsql;
comment on function enlever_referent is 'Enlever un referent à la fiche';

-- ACTION
create table fiche_action_action
(
    fiche_id integer references fiche_action not null,
    action_id action_id references action_relation not null,
    primary key (fiche_id, action_id)
);
alter table fiche_action_action enable row level security;
create policy allow_read on fiche_action_action for select using(is_authenticated());
create policy allow_insert on fiche_action_action for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_action for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_action for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_action(
    id_fiche integer,
    id_action action_id
) returns void as $$
begin
    insert into fiche_action_action
    values (id_fiche, id_action);
end;
$$ language plpgsql;
comment on function ajouter_action is 'Ajouter une action à la fiche';

create function enlever_action(
    id_fiche integer,
    id_action action_id
) returns void as $$
begin
    delete from fiche_action_action
    where fiche_id = id_fiche and action_id = id_action;
end;
$$ language plpgsql;
comment on function enlever_action is 'Enlever une action à la fiche';


-- INDICATEUR
create table fiche_action_indicateur
(
    fiche_id integer references fiche_action not null,
    indicateur_id indicateur_id references indicateur_definition,
    indicateur_personnalise_id integer references indicateur_personnalise_definition,
    -- unique au lieu de primary key pour autoriser le null sur un des deux indicateur ids
    unique (fiche_id, indicateur_id, indicateur_personnalise_id)
);
alter table fiche_action_indicateur enable row level security;
create policy allow_read on fiche_action_indicateur for select using(is_authenticated());
create policy allow_insert on fiche_action_indicateur for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_indicateur for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_indicateur for delete using(peut_modifier_la_fiche(fiche_id));

create type indicateur_global as
(
    indicateur_id indicateur_id,
    indicateur_personnalise_id integer,
    nom text,
    description text,
    unite text
);

create function ajouter_indicateur(
    id_fiche integer,
    indicateur indicateur_global
) returns void as $$
begin
    insert into fiche_action_indicateur (fiche_id, indicateur_id, indicateur_personnalise_id)
    values (id_fiche, indicateur.indicateur_id, indicateur.indicateur_personnalise_id);
end;
$$ language plpgsql;
comment on function ajouter_indicateur is 'Ajouter une indicateur à la fiche';

create function enlever_indicateur(
    id_fiche integer,
    indicateur indicateur_global
) returns void as $$
begin
    if indicateur.indicateur_id is null then
        delete from fiche_action_indicateur
        where fiche_id = id_fiche and indicateur_personnalise_id = indicateur.indicateur_personnalise_id;
    else
        delete from fiche_action_indicateur
        where fiche_id = id_fiche and indicateur_id = indicateur.indicateur_id;
    end if;
end;
$$ language plpgsql;
comment on function enlever_indicateur is 'Enlever une indicateur à la fiche';

create function indicateurs_collectivite(
    id_collectivite integer
) returns setof indicateur_global as $$
select
    null as indicateur_id,
    ipd.id as indicateur_personnalise_id,
    ipd.titre as nom,
    ipd.description,
    ipd.unite
from indicateur_personnalise_definition ipd
where ipd.collectivite_id = id_collectivite
union
select
    id.id as personne_tag_id,
    null as indicateur_personnalise_id,
    id.nom,
    id.description,
    id.unite
from indicateur_definition id
$$ language sql;
comment on function indicateurs_collectivite is 'Liste les indicateurs (globaux et personnalisés) d''une collectivite';

-- DOCUMENT ET LIEN
create table annexe
(
    id        serial primary key,
    like labellisation.preuve_base including all
);
alter table annexe enable row level security;
create policy allow_read on annexe for select using(is_authenticated());
create policy allow_insert on annexe for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on annexe for update using(have_edition_acces(collectivite_id));
create policy allow_delete on annexe for delete using(have_edition_acces(collectivite_id));

create table fiche_action_annexe
(
    fiche_id integer references fiche_action not null,
    annexe_id integer references annexe not null,
    primary key (fiche_id, annexe_id)
);
alter table fiche_action_annexe enable row level security;
create policy allow_read on fiche_action_annexe for select using(is_authenticated());
create policy allow_insert on fiche_action_annexe for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_annexe for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_annexe for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_annexe(
    id_fiche integer,
    annexe annexe
) returns annexe as $$
declare
    id_annexe integer;
begin
    id_annexe = annexe.id;
    if id_annexe is null then
        insert into annexe (collectivite_id, fichier_id, url, titre, commentaire)
        values (annexe.collectivite_id, annexe.fichier_id, annexe.url, annexe.titre, annexe.commentaire)
        returning id into id_annexe;
        annexe.id = id_annexe;
    end if;
    insert into fiche_action_annexe (fiche_id, annexe_id)
    values (id_fiche, id_annexe);
    return annexe;
end;
$$ language plpgsql;
comment on function ajouter_annexe is 'Ajouter une annexe à la fiche';

create function enlever_annexe(
    id_fiche integer,
    annexe annexe,
    supprimer boolean
) returns void as $$
begin
    delete from fiche_action_annexe
    where fiche_id = id_fiche and annexe_id = annexe.id;
    if supprimer then
        delete from annexe where id = annexe.id;
    end if;
end;
$$ language plpgsql;
comment on function enlever_annexe is 'Enlever une annexe à la fiche';



-- Vue listant les fiches actions et ses données liées
create view fiches_action as
select fa.*,
       p.partenaires,
       s.structures,
       pi.pilotes,
       re.referents,
       anne.annexes,
       pla.axes,
       act.actions,
       ind.indicateurs
from fiche_action fa
         -- partenaires
         left join lateral (
    select array_agg(pt.*::partenaire_tag) as partenaires
    from partenaire_tag pt
             join fiche_action_partenaire_tag fapt on fapt.partenaire_tag_id = pt.id
    where fapt.fiche_id = fa.id
    ) as p on true
    -- structures
         left join lateral (
    select array_agg(st.*::structure_tag) as structures
    from structure_tag st
             join fiche_action_structure_tag fast on fast.structure_tag_id = st.id
    where fast.fiche_id = fa.id
    ) as s on true
    -- pilotes
         left join lateral (
    select array_agg(pil.*::personne) as pilotes
    from (
             select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                    pt.collectivite_id,
                    fap.personne_tag_id,
                    fap.utilisateur_uuid
             from fiche_action_pilote fap
                      left join personne_tag pt on fap.personne_tag_id = pt.id
                      left join dcp on fap.utilisateur_uuid = dcp.user_id
             where fap.fiche_id = fa.id
         ) pil
    ) as pi on true
    -- referents
         left join lateral (
    select array_agg(ref.*::personne) as referents
    from (
             select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                    pt.collectivite_id,
                    far.personne_tag_id,
                    far.utilisateur_uuid
             from fiche_action_referent far
                      left join personne_tag pt on far.personne_tag_id = pt.id
                      left join dcp on far.utilisateur_uuid = dcp.user_id
             where far.fiche_id = fa.id
         ) ref
    ) as re on true
    -- annexes
         left join lateral (
    select array_agg(a.*::annexe) as annexes
    from annexe a
             join fiche_action_annexe faa on faa.annexe_id = a.id
    where faa.fiche_id = fa.id
    ) as anne on true
    -- axes
         left join lateral (
    select array_agg(pa.*::axe) as axes
    from axe pa
             join fiche_action_axe fapa on fapa.axe_id = pa.id
    where fapa.fiche_id = fa.id
    ) as pla on true
    -- actions
         left join lateral (
    select array_agg(ar.*::action_relation) as actions
    from action_relation ar
             join fiche_action_action faa on faa.action_id = ar.id
    where faa.fiche_id = fa.id
    ) as act on true
    -- indicateurs
         left join lateral (
    select array_agg(indi.*::indicateur_global) as indicateurs
    from (
             select fai.indicateur_id,
                    fai.indicateur_personnalise_id,
                    coalesce(id.nom, ipd.titre) as nom,
                    coalesce(id.description, ipd.description) as description,
                    coalesce(id.unite, ipd.unite) as unite
             from fiche_action_indicateur fai
                      left join indicateur_definition id on fai.indicateur_id = id.id
                      left join indicateur_personnalise_definition ipd on fai.indicateur_personnalise_id = ipd.id
             where fai.fiche_id = fa.id
         ) indi
    ) as ind on true
-- TODO fiches liées (à calculer dans la vue selon action et indicateurs?)
;

create or replace function upsert_fiche_action()
    returns trigger as
$$
declare
    id_fiche integer;
    axe axe;
    partenaire partenaire_tag;
    structure structure_tag;
    pilote personne;
    referent personne;
    action action_relation;
    indicateur indicateur_global;
    annexe annexe;
begin
    id_fiche = new.id;
    -- Fiche action
    if id_fiche is null then
        insert into fiche_action (titre,
                                  description,
                                  thematiques,
                                  sous_thematiques,
                                  piliers_eci,
                                  objectifs,
                                  resultats_attendus,
                                  cibles,
                                  ressources,
                                  financements,
                                  budget_previsionnel,
                                  statut,
                                  niveau_priorite,
                                  date_debut,
                                  date_fin_provisoire,
                                  amelioration_continue,
                                  calendrier,
                                  notes_complementaires,
                                  maj_termine,
                                  collectivite_id)
        values (new.titre,
                new.description,
                new.thematiques,
                new.sous_thematiques,
                new.piliers_eci,
                new.objectifs,
                new.resultats_attendus,
                new.cibles,
                new.ressources,
                new.financements,
                new.budget_previsionnel,
                new.statut,
                new.niveau_priorite,
                new.date_debut,
                new.date_fin_provisoire,
                new.amelioration_continue,
                new.calendrier,
                new.notes_complementaires,
                new.maj_termine,
                new.collectivite_id)
        returning id into id_fiche;
    else
        update fiche_action
        set
            titre = new.titre,
            description= new.description,
            thematiques= new.thematiques,
            sous_thematiques= new.sous_thematiques,
            piliers_eci= new.piliers_eci,
            objectifs= new.objectifs,
            resultats_attendus= new.resultats_attendus,
            cibles= new.cibles,
            ressources= new.ressources,
            financements= new.financements,
            budget_previsionnel= new.budget_previsionnel,
            statut= new.statut,
            niveau_priorite= new.niveau_priorite,
            date_debut= new.date_debut,
            date_fin_provisoire= new.date_fin_provisoire,
            amelioration_continue= new.amelioration_continue,
            calendrier= new.calendrier,
            notes_complementaires= new.notes_complementaires,
            maj_termine= new.maj_termine,
            collectivite_id = new.collectivite_id
        where id = id_fiche;
    end if;

    -- Axes
    delete from fiche_action_axe where fiche_id = id_fiche;
    if new.axes is not null then
        foreach axe in array new.axes::axe[]
            loop
                perform ajouter_fiche_action_dans_un_axe(id_fiche, axe.id);
            end loop;
    end if;

    -- Partenaires
    delete from fiche_action_partenaire_tag where fiche_id = id_fiche;
    if new.partenaires is not null then
        foreach partenaire in array new.partenaires::partenaire_tag[]
            loop
                perform ajouter_partenaire(id_fiche,partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform ajouter_structure(id_fiche,structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform ajouter_pilote(id_fiche,pilote);
            end loop;
    end if;

    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform ajouter_referent(id_fiche,referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_global[]
            loop
                perform ajouter_indicateur(id_fiche,indicateur);
            end loop;
    end if;

    -- Annexes
    delete from fiche_action_annexe where fiche_id = id_fiche;
    if new.annexes is not null then
        foreach annexe in array new.annexes::annexe[]
            loop
                perform ajouter_annexe(id_fiche,annexe);
            end loop;
    end if;

    return new;
end;
$$ language plpgsql;

create or replace function delete_fiche_action()
    returns trigger as
$$
declare
begin
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    delete from fiche_action_pilote where fiche_id = old.id;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_annexe where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
end;
$$ language plpgsql;

create trigger upsert
    instead of insert or update
    on fiches_action
    for each row
execute procedure upsert_fiche_action();

create trigger delete
    before delete
    on fiche_action
    for each row
execute procedure delete_fiche_action();

-- Fonction récursive pour afficher un plan d'action
create or replace function plan_action(pa_id integer) returns jsonb as
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
                                join fiche_action_axe fapa on fa.id = fapa.fiche_id
                       where fapa.axe_id = pa_id)) ;
    pa_nom = (select nom from axe where id = pa_id);
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = pa_id
        loop
            enfants[id_loop] = plan_action(pa_enfant_id);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('id', pa_id,
                                   'nom', pa_nom,
                                   'fiches', fiches,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql;
comment on function plan_action is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    ses fiches et ses plans d''actions enfants de manière récursive';

-- Transfert donnees
do $$
    declare
        mpa migration.plan_action;
        mfa migration.fiche_action;
        st fiche_action_statuts;
        fiche_id integer;
        plan_action_id integer;
        elem text;
        elem_id integer;
        action_id action_id;
        indicateur_id indicateur_id;
        fiche_migration jsonb[];
        fiche_iteration integer;
        categorie jsonb;
        fiche_axe jsonb;
        axe_id integer;
        axe_migration jsonb[];
        axe_iteration integer;
        axe_a_lier integer;
        fiche_a_lier integer;
    begin
        -- TODO ne pas migrer ceux à supprimer
        fiche_iteration = 1;
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
                insert into public.fiche_action
                (titre, description, budget_previsionnel, statut, collectivite_id, date_debut, date_fin_provisoire)
                values(mfa.titre, mfa.description, mfa.budget_global, st, mfa.collectivite_id,
                       to_date(mfa.date_debut, 'YYYY-MM-DD'), to_date(mfa.date_fin, 'YYYY-MM-DD'))
                returning id into fiche_id;

                -- Partenaires
                for elem in select regexp_split_to_array(replace(mfa.partenaires, ' et ', '-'), E'[-,/+]')
                    loop
                        elem = trim(elem);
                        if elem <> '' then
                            insert into partenaire_tag (nom, collectivite_id)
                            values(elem, mfa.collectivite_id)
                            on conflict (nom, collectivite_id) do update set nom = elem
                            returning id into elem_id;

                            insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id)
                            values (fiche_id, elem_id);
                        end if;
                    end loop;

                -- Structures
                for elem in select regexp_split_to_array(replace(mfa.structure_pilote, ' et ', '-'), E'[-,/+]')
                    loop
                        elem = trim(elem);
                        if elem <> '' then
                            insert into structure_tag (nom, collectivite_id)
                            values(elem, mfa.collectivite_id)
                            on conflict (nom, collectivite_id) do update set nom = elem
                            returning id into elem_id;

                            insert into fiche_action_structure_tag (fiche_id, structure_tag_id)
                            values (fiche_id, elem_id);
                        end if;
                    end loop;

                -- Referents
                for elem in select regexp_split_to_array(replace(mfa.elu_referent, ' et ', ' / '), E' / ')
                    loop
                        elem = trim(elem);
                        if elem <> '' then
                            insert into personne_tag (nom, collectivite_id)
                            values(elem, mfa.collectivite_id)
                            on conflict (nom, collectivite_id) do update set nom = elem
                            returning id into elem_id;

                            insert into fiche_action_referent (fiche_id, utilisateur_uuid, personne_tag_id)
                            values (fiche_id, null, elem_id);
                        end if;
                    end loop;

                -- Pilotes
                for elem in select regexp_split_to_array(replace(mfa.personne_referente, ' et ', ' / '), E' / ')
                    loop
                        elem = trim(elem);
                        if elem <> '' then
                            insert into personne_tag (nom, collectivite_id)
                            values(elem, mfa.collectivite_id)
                            on conflict (nom, collectivite_id) do update set nom = elem
                            returning id into elem_id;

                            insert into fiche_action_pilote (fiche_id, utilisateur_uuid, personne_tag_id)
                            values (fiche_id, null, elem_id);
                        end if;
                    end loop;

                -- Actions
                foreach action_id in array mfa.action_ids
                    loop
                        perform ajouter_action(fiche_id, action_id);
                    end loop;

                -- Indicateurs
                foreach indicateur_id in array mfa.indicateur_ids
                    loop
                        insert into fiche_action_indicateur (fiche_id, indicateur_id, indicateur_personnalise_id)
                        values (fiche_id, indicateur_id, null);
                    end loop;
                foreach elem_id in array mfa.indicateur_personnalise_ids
                    loop
                        insert into fiche_action_indicateur (fiche_id, indicateur_id, indicateur_personnalise_id)
                        values (fiche_id, null, elem_id);
                    end loop;

                fiche_migration[fiche_iteration] = jsonb_build_object('old', mfa.uid, 'new', fiche_id);
                fiche_iteration = fiche_iteration+1;
            end loop;

        -- Plans action
        axe_iteration = 1;
        for mpa in select * from migration.plan_action
            loop
                -- Ajout du plan d'action
                insert into axe (nom, collectivite_id, parent)
                values (mpa.nom, mpa.collectivite_id, null)
                returning id into plan_action_id;
                -- Ajout des axes du plan d'action
                for categorie in select json_array_elements(mpa.categories)
                    loop
                        insert into axe (nom, collectivite_id, parent)
                        values (categorie ->> 'nom', mpa.collectivite_id, plan_action_id)
                        returning id into axe_id;
                        axe_migration[axe_iteration] = json_build_object('old', categorie ->> 'uid',
                                                                         'new', axe_id,
                                                                         'plan', plan_action_id);
                        axe_iteration = axe_iteration +1;
                    end loop;
                -- Ajout des fiches aux axes
                for fiche_axe in select json_array_elements(mpa.fiches_by_category)
                    loop
                        select fm ->> 'new'
                        from json_array_elements(fiche_migration) fm
                        where fm ->> 'old' = fiche_axe ->> 'fiche_uid'
                        limit 1 into fiche_a_lier;

                        select am ->> 'new'
                        from json_array_elements(axe_migration) am
                        where am ->> 'old' = fiche_axe ->> 'category_uid'
                          and am ->> 'plan' = plan_action_id
                        limit 1 into axe_a_lier;

                        perform ajouter_fiche_action_dans_un_axe(fiche_a_lier, axe_a_lier);
                    end loop;
            end loop;
    end
$$;

create materialized view stats.collectivite_plan_action
as
with fa as (select collectivite_id,
                   count(*) as count
            from fiche_action f
            group by f.collectivite_id),
     pa as (select collectivite_id,
                   count(*) as count
            from axe p
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