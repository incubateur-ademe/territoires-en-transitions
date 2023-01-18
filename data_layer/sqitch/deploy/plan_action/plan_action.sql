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

drop materialized view stats.collectivite_plan_action;

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
    'Allongement de la durée d’usage',
    'Amélioration de la qualité de vie',
    'Développement des énergies renouvelables',
    'Efficacité énergétique',
    'Préservation de la biodiversité',
    'Réduction des consommations énergétiques',
    'Réduction des déchets',
    'Réduction des émissions de gaz à effet de serre',
    'Réduction des polluants atmosphériques',
    'Sobriété énergétique'
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
create table private.tag -- table abstraite
(
    nom text not null,
    collectivite_id integer references collectivite not null,
    unique(nom, collectivite_id)
);
comment on table private.tag is
    'Table abstraite.';
alter table private.tag enable row level security;

-- FICHE ACTION
create table fiche_action
(
    id                      serial primary key,
    titre                   varchar(300) default 'Nouvelle fiche',
    description             varchar(20000),
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
    collectivite_id         integer references collectivite not null,
    created_at              timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_by             uuid references auth.users default auth.uid()
) inherits (abstract_modified_at);
alter table fiche_action enable row level security;
create policy allow_read on fiche_action for select using(is_authenticated());
create policy allow_insert on fiche_action for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on fiche_action for update using(have_edition_acces(collectivite_id));
create policy allow_delete on fiche_action for delete using(have_edition_acces(collectivite_id));

create trigger set_modified_at_before_fiche_action
    before update
    on
        fiche_action
    for each row
execute procedure update_modified_at();
create trigger set_modified_by_before_fiche_action
    before update
    on
        fiche_action
    for each row
execute procedure utilisateur.update_modified_by();


create function peut_modifier_la_fiche(fiche_id integer) returns boolean as $$
begin
    return have_edition_acces((select fa.collectivite_id from fiche_action fa where fa.id = fiche_id limit 1));
end;
$$language plpgsql;

create table thematique
(
    thematique text primary key
);
insert into thematique
values
    ('Activités économiques'),
    ('Culture, identité collective, sport'),
    ('Eau, milieux aquatiques et assainissement'),
    ('Économie circulaire et déchets'),
    ('Énergie et climat'),
    ('Mobilité et transport'),
    ('Nature, environnement, air'),
    ('Solidarité et lien social'),
    ('Stratégie, organisation interne, coopération et valorisation'),
    ('Urbanisme, logement, aménagement, bâtiments');
alter table thematique enable row level security;
create policy allow_read on thematique for select using(is_authenticated());

create table fiche_action_thematique
(
    fiche_id integer references fiche_action not null,
    thematique text references thematique not null,
    primary key (fiche_id, thematique)
);
alter table fiche_action_thematique enable row level security;
create policy allow_read on fiche_action_thematique for select using(is_authenticated());
create policy allow_insert on fiche_action_thematique for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_thematique for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_thematique for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_thematique(
    fiche_id integer,
    thematique text
) returns void as $$
begin
    insert into fiche_action_thematique
    values (ajouter_thematique.fiche_id, ajouter_thematique.thematique);
end;
$$ language plpgsql;
comment on function ajouter_thematique is 'Ajouter une thématique à la fiche';

create function enlever_thematique(
    fiche_id integer,
    thematique text
) returns void as $$
begin
    delete from fiche_action_thematique
    where fiche_action_thematique.fiche_id = enlever_thematique.fiche_id
      and fiche_action_thematique.thematique = enlever_thematique.thematique;
end;
$$ language plpgsql;
comment on function enlever_thematique is 'Enlever une thématique de la fiche';


create table sous_thematique
(
    id serial primary key,
    thematique text not null,
    sous_thematique text not null,
    unique (thematique, sous_thematique)
);
insert into sous_thematique (thematique, sous_thematique)
values
    ('Activités économiques', 'Agriculture et alimentation'),
    ('Activités économiques', 'Artisanat'),
    ('Activités économiques', 'Attractivité et revitalisation économique'),
    ('Activités économiques', 'Commerces et services'),
    ('Activités économiques', 'Economie locale et circuits courts'),
    ('Activités économiques', 'Economie sociale et solidaire'),
    ('Activités économiques', 'Emploi'),
    ('Activités économiques', 'Fiscalité des entreprises'),
    ('Activités économiques', 'Formation professionnelle'),
    ('Activités économiques', 'Industrie'),
    ('Activités économiques', 'Technologies numériques et numérisation'),
    ('Activités économiques', 'Tiers-lieux'),
    ('Activités économiques', 'Tourisme'),
    ('Culture, identité collective, sport', 'Bibliothèques et livres'),
    ('Culture, identité collective, sport', 'Culture et identité collective'),
    ('Culture, identité collective, sport', 'Médias et communication'),
    ('Culture, identité collective, sport', 'Musée'),
    ('Culture, identité collective, sport', 'Patrimoine et monuments historiques'),
    ('Culture, identité collective, sport', 'Spectacle vivant'),
    ('Culture, identité collective, sport', 'Sports et loisirs'),
    ('Eau, milieux aquatiques et assainissement', 'Assainissement des eaux'),
    ('Eau, milieux aquatiques et assainissement', 'Cours d’eau, canaux, plans d’eau'),
    ('Eau, milieux aquatiques et assainissement', 'Eau de pluie'),
    ('Eau, milieux aquatiques et assainissement', 'Eau potable'),
    ('Eau, milieux aquatiques et assainissement', 'Eau souterraine'),
    ('Eau, milieux aquatiques et assainissement', 'Mers et océans'),
    ('Économie circulaire et déchets', 'Allongement de la durée d’usage'),
    ('Économie circulaire et déchets', 'Consommation responsable et achats durables'),
    ('Économie circulaire et déchets', 'Éco-conception'),
    ('Économie circulaire et déchets', 'Écologie industrielle et territoriale'),
    ('Économie circulaire et déchets', 'Économie de la fonctionnalité'),
    ('Économie circulaire et déchets', 'Gestion des déchets : collecte'),
    ('Économie circulaire et déchets', 'Gestion des déchets : recyclage et valorisation des déchets'),
    ('Économie circulaire et déchets', 'Innovation, créativité et recherche'),
    ('Économie circulaire et déchets', 'Production responsable'),
    ('Énergie et climat', 'Adaptation au changement climatique'),
    ('Énergie et climat', 'Développement des énergies renouvelables'),
    ('Énergie et climat', 'Distribution de l’énergie'),
    ('Énergie et climat', 'Efficacité énergétique'),
    ('Énergie et climat', 'Gestion de l’énergie : maîtrise et réduction des consommations énergétiques'),
    ('Énergie et climat', 'Réduction des émissions de gaz à effet de serre'),
    ('Énergie et climat', 'Rénovation énergétique'),
    ('Énergie et climat', 'Réseaux de chaleur'),
    ('Énergie et climat', 'Sobriété énergétique'),
    ('Mobilité et transport', 'Connaissance de la mobilité'),
    ('Mobilité et transport', 'Information voyageur, billettique multimodale'),
    ('Mobilité et transport', 'Limitation des déplacements subis'),
    ('Mobilité et transport', 'Logistique urbaine'),
    ('Mobilité et transport', 'Mobilité et véhicules autonomes'),
    ('Mobilité et transport', 'Mobilité fluviale'),
    ('Mobilité et transport', 'Mobilité partagée'),
    ('Mobilité et transport', 'Mobilité pour tous'),
    ('Mobilité et transport', 'Modes actifs : vélo, marche et aménagements associés'),
    ('Mobilité et transport', 'Transports collectifs et optimisation des trafics routiers'),
    ('Nature, environnement, air', 'Biodiversité'),
    ('Nature, environnement, air', 'Forêts'),
    ('Nature, environnement, air', 'Milieux humides'),
    ('Nature, environnement, air', 'Montagne'),
    ('Nature, environnement, air', 'Qualité de l’air'),
    ('Nature, environnement, air', 'Risques naturels'),
    ('Nature, environnement, air', 'Sols'),
    ('Nature, environnement, air', 'Solutions d’adaptation fondées sur la nature'),
    ('Solidarité et lien social', 'Accès aux services'),
    ('Solidarité et lien social', 'Citoyenneté'),
    ('Solidarité et lien social', 'Cohésion sociale et inclusion'),
    ('Solidarité et lien social', 'Education et renforcement des compétences'),
    ('Solidarité et lien social', 'Egalité des chances'),
    ('Solidarité et lien social', 'Famille et enfance'),
    ('Solidarité et lien social', 'Handicap'),
    ('Solidarité et lien social', 'Inclusion numérique'),
    ('Solidarité et lien social', 'Jeunesse'),
    ('Solidarité et lien social', 'Lutte contre la précarité des conditions de vie (insécurité alimentaire, précarité énergétique, sanitaire, liée au logement, à la mobilité…)'),
    ('Solidarité et lien social', 'Personnes âgées'),
    ('Solidarité et lien social', 'Protection animale'),
    ('Solidarité et lien social', 'Santé'),
    ('Solidarité et lien social', 'Sécurité'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Animation et mise en réseau'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Appui méthodologique'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Budget et financement'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Communication, formation et sensibilisation'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Diagnostic, objectifs et stratégie'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Organisation interne'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Partenariats et coopération (publique, privé, associatif, international, infra et supra collectivité)'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Prévention des risques professionnels'),
    ('Stratégie, organisation interne, coopération et valorisation', 'Valorisation d’actions'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Accessibilité'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Architecture'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Bâtiments et construction'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Cimetières et funéraire'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Equipement public'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Espace public'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Espaces verts'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Foncier'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Friche'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Logement et habitat'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Paysage'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Réhabilitation'),
    ('Urbanisme, logement, aménagement, bâtiments', 'Voirie et réseaux');
alter table sous_thematique enable row level security;
create policy allow_read on sous_thematique for select using(is_authenticated());
create table fiche_action_sous_thematique
(
    fiche_id integer references fiche_action not null,
    thematique_id integer references sous_thematique not null,
    primary key (fiche_id, thematique_id)
);
alter table fiche_action_sous_thematique enable row level security;
create policy allow_read on fiche_action_sous_thematique for select using(is_authenticated());
create policy allow_insert on fiche_action_sous_thematique for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_sous_thematique for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_sous_thematique for delete using(peut_modifier_la_fiche(fiche_id));

create function ajouter_sous_thematique(
    fiche_id integer,
    thematique_id integer
) returns void as $$
begin
    insert into fiche_action_sous_thematique
    values (ajouter_sous_thematique.fiche_id, ajouter_sous_thematique.thematique_id);
end;
$$ language plpgsql;
comment on function ajouter_sous_thematique is 'Ajouter une sous-thématique à la fiche';

create function enlever_sous_thematique(
    fiche_id integer,
    thematique_id integer
) returns void as $$
begin
    delete from fiche_action_sous_thematique
    where fiche_action_sous_thematique.fiche_id = enlever_sous_thematique.fiche_id
      and fiche_action_sous_thematique.thematique_id = enlever_sous_thematique.thematique_id;
end;
$$ language plpgsql;
comment on function enlever_sous_thematique is 'Enlever une sous-thématique de la fiche';

-- AXE
create table axe
(
    id              serial primary key,
    nom             text,
    collectivite_id integer references collectivite not null,
    parent          integer references axe,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_by     uuid references auth.users default auth.uid()
) inherits (abstract_modified_at);
comment on table axe is
    'Les axes des plans d''action.';
comment on column axe.parent is
    'Le parent de l''axe, lorsque qu''il est `null` alors l''axe est à la racine et on le considère en tant que plan d''action.';

alter table axe enable row level security;
create policy allow_read on axe for select using(is_authenticated());
create policy allow_insert on axe for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on axe for update using(have_edition_acces(collectivite_id));
create policy allow_delete on axe for delete using(have_edition_acces(collectivite_id));

create trigger set_modified_at_before_axe
    before update
    on
        axe
    for each row
execute procedure update_modified_at();
create trigger set_modified_by_before_axe
    before update
    on
        axe
    for each row
execute procedure utilisateur.update_modified_by();

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
    fiche_id integer,
    axe_id integer
) returns void as $$
begin
    insert into fiche_action_axe
    values (ajouter_fiche_action_dans_un_axe.fiche_id, ajouter_fiche_action_dans_un_axe.axe_id);
end;
$$ language plpgsql;
comment on function ajouter_fiche_action_dans_un_axe is 'Ajouter une fiche action dans un axe';

create function enlever_fiche_action_d_un_axe(
    fiche_id integer,
    axe_id integer
) returns void as $$
begin
    delete from fiche_action_axe
    where fiche_action_axe.fiche_id = enlever_fiche_action_d_un_axe.fiche_id
      and fiche_action_axe.axe_id = enlever_fiche_action_d_un_axe.axe_id;
end;
$$ language plpgsql;
comment on function enlever_fiche_action_d_un_axe is 'Enlever une fiche action d''un axe';

create function plans_action_collectivite(
    collectivite_id integer
) returns setof axe as $$
select axe.*
from axe
where axe.collectivite_id = plans_action_collectivite.collectivite_id
  and axe.parent is null;
$$ language sql;
comment on function plans_action_collectivite is 'Liste les plans action d''une collectivite';


-- PARTENAIRE
create table partenaire_tag
(
    id serial primary key,
    like private.tag including all
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
    fiche_id integer,
    partenaire partenaire_tag
) returns partenaire_tag as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id; -- Ne veut pas prendre ajoute_partenaire.fiche_id
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
    fiche_id integer,
    partenaire partenaire_tag
) returns void as $$
begin
    delete from fiche_action_partenaire_tag
    where fiche_action_partenaire_tag.fiche_id = enlever_partenaire.fiche_id
      and partenaire_tag_id = partenaire.id;
end;
$$ language plpgsql;
comment on function enlever_partenaire is 'Enlever un partenaire à la fiche';

-- STRUCTURE PILOTE
create table structure_tag
(
    id serial primary key,
    like private.tag including all
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
    fiche_id integer,
    structure structure_tag
) returns structure_tag as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id; -- Ne veut pas prendre ajouter_structure.fiche_id
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
    fiche_id integer,
    structure structure_tag
) returns void as $$
begin
    delete from fiche_action_structure_tag
    where fiche_action_structure_tag.fiche_id = enlever_structure.fiche_id
      and structure_tag_id = structure.id;
end;
$$ language plpgsql;
comment on function enlever_structure is 'Enlever une structure à la fiche';

-- PERSONNE
create table personne_tag
(
    id serial primary key,
    like private.tag including all
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
    tag_id integer,
    user_id uuid
);

create function personnes_collectivite(
    collectivite_id integer
) returns setof personne as $$
select
    pt.nom,
    pt.collectivite_id,
    pt.id as tag_id,
    null::uuid as user_id
from personne_tag pt
where pt.collectivite_id = personnes_collectivite.collectivite_id
union
select
    concat(cm.prenom, ' ', cm.nom) as nom,
    personnes_collectivite.collectivite_id,
    null::integer as tag_id,
    cm.user_id::uuid as user_id
from collectivite_membres(personnes_collectivite.collectivite_id) cm;
$$ language sql;
comment on function personnes_collectivite is 'Liste les personnes (tags et utilisateurs) d''une collectivite';

-- PERSONNE PILOTE
create table fiche_action_pilote
(
    fiche_id integer references fiche_action not null,
    user_id uuid references auth.users,
    tag_id integer references personne_tag,
    -- unique au lieu de primary key pour autoriser le null sur utilisateur ou tags
    unique(fiche_id, user_id, tag_id)
);
alter table fiche_action_pilote enable row level security;
create policy allow_read on fiche_action_pilote for select using(is_authenticated());
create policy allow_insert on fiche_action_pilote for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_pilote for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_pilote for delete using(peut_modifier_la_fiche(fiche_id));

create view fiche_action_personne_pilote
as
select t.collectivite_id,
       t.nom,
       null::uuid as user_id,
       t.id       as tag_id
from personne_tag t
where have_lecture_acces(t.collectivite_id)
union all
select m.collectivite_id,
       dcp.nom || ' ' || dcp.prenom,
       m.user_id,
       null
from private_collectivite_membre m
         join utilisateur.dcp_display dcp on dcp.user_id = m.user_id
where have_lecture_acces(m.collectivite_id); -- protège les DCPs
comment on view fiche_action_personne_pilote is
    'Permet de lister les pilotes possibles pour les fiches actions.';

create function ajouter_pilote(
    fiche_id integer,
    pilote personne
) returns personne as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id; -- Ne veut pas prendre ajouter_pilote.fiche_id
    if pilote.user_id is null then
        insert into personne_tag (nom, collectivite_id)
        values (pilote.nom,  pilote.collectivite_id)
        on conflict (nom, collectivite_id) do update set nom = pilote.nom
        returning id into id_tag;
        pilote.tag_id = id_tag;
        insert into fiche_action_pilote (fiche_id, user_id, tag_id)
        values (id_fiche, null, id_tag);
    else
        insert into fiche_action_pilote (fiche_id, user_id, tag_id)
        values (id_fiche, pilote.user_id, null);
    end if;
    return pilote;
end;
$$ language plpgsql;
comment on function ajouter_pilote is 'Ajouter un pilote à la fiche';

create function enlever_pilote(
    fiche_id integer,
    pilote personne
) returns void as $$
begin
    if pilote.user_id is null then
        delete from fiche_action_pilote
        where fiche_action_pilote.fiche_id = enlever_pilote.fiche_id
          and tag_id = pilote.tag_id;
    else
        delete from fiche_action_pilote
        where fiche_action_pilote.fiche_id = enlever_pilote.fiche_id
          and user_id = pilote.user_id;
    end if;

end;
$$ language plpgsql;
comment on function enlever_pilote is 'Enlever un pilote à la fiche';

-- REFERENT
create table fiche_action_referent
(
    fiche_id integer references fiche_action not null,
    user_id uuid references auth.users,
    tag_id integer references personne_tag,
    -- unique au lieu de primary key pour autoriser le null sur utilisateur ou tag
    unique(fiche_id, user_id, tag_id)
);
alter table fiche_action_referent enable row level security;
create policy allow_read on fiche_action_referent for select using(is_authenticated());
create policy allow_insert on fiche_action_referent for insert with check(peut_modifier_la_fiche(fiche_id));
create policy allow_update on fiche_action_referent for update using(peut_modifier_la_fiche(fiche_id));
create policy allow_delete on fiche_action_referent for delete using(peut_modifier_la_fiche(fiche_id));

create view fiche_action_personne_referente
as
select t.collectivite_id,
       t.nom,
       null::uuid as user_id,
       t.id       as tag_id
from personne_tag t
where have_lecture_acces(t.collectivite_id)
union all
select m.collectivite_id,
       dcp.nom || ' ' || dcp.prenom,
       m.user_id,
       null
from private_collectivite_membre m
         join utilisateur.dcp_display dcp on dcp.user_id = m.user_id
where have_lecture_acces(m.collectivite_id); -- protège les DCPs
comment on view fiche_action_personne_referente is
    'Permet de lister les referents possibles pour les fiches actions.';


create function ajouter_referent(
    fiche_id integer,
    referent personne
) returns personne as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id; -- Ne veut pas prendre ajouter_referent.fiche_id
    if referent.user_id is null then
        id_tag = referent.tag_id;
        if id_tag is null then
            insert into personne_tag (nom, collectivite_id)
            values (referent.nom,  referent.collectivite_id)
            on conflict (nom, collectivite_id) do update set nom = referent.nom
            returning id into id_tag;
            referent.tag_id = id_tag;
        end if;
        insert into fiche_action_referent (fiche_id, user_id, tag_id)
        values (id_fiche, null, id_tag);
    else
        insert into fiche_action_referent (fiche_id, user_id, tag_id)
        values (id_fiche, referent.user_id, null);
    end if;
    return referent;
end;
$$ language plpgsql;
comment on function ajouter_referent is 'Ajouter un referent à la fiche';

create function enlever_referent(
    fiche_id integer,
    referent personne
) returns void as $$
begin
    if referent.user_id is null then
        delete from fiche_action_referent
        where fiche_action_referent.fiche_id = enlever_referent.fiche_id
          and tag_id = referent.tag_id;
    else
        delete from fiche_action_referent
        where fiche_action_referent.fiche_id = enlever_referent.fiche_id
          and user_id = referent.user_id;
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
    fiche_id integer,
    action_id action_id
) returns void as $$
begin
    insert into fiche_action_action
    values (ajouter_action.fiche_id, ajouter_action.action_id);
end;
$$ language plpgsql;
comment on function ajouter_action is 'Ajouter une action à la fiche';

create function enlever_action(
    fiche_id integer,
    action_id action_id
) returns void as $$
begin
    delete from fiche_action_action
    where fiche_action_action.fiche_id = enlever_action.fiche_id
      and fiche_action_action.action_id = enlever_action.action_id;
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

create type indicateur_generique as
(
    indicateur_id indicateur_id,
    indicateur_personnalise_id integer,
    nom text,
    description text,
    unite text
);

create function ajouter_indicateur(
    fiche_id integer,
    indicateur indicateur_generique
) returns void as $$
begin
    insert into fiche_action_indicateur (fiche_id, indicateur_id, indicateur_personnalise_id)
    values (ajouter_indicateur.fiche_id, indicateur.indicateur_id, indicateur.indicateur_personnalise_id);
end;
$$ language plpgsql;
comment on function ajouter_indicateur is 'Ajouter une indicateur à la fiche';

create function enlever_indicateur(
    fiche_id integer,
    indicateur indicateur_generique
) returns void as $$
begin
    if indicateur.indicateur_id is null then
        delete from fiche_action_indicateur
        where fiche_action_indicateur.fiche_id = enlever_indicateur.fiche_id
          and indicateur_personnalise_id = indicateur.indicateur_personnalise_id;
    else
        delete from fiche_action_indicateur
        where fiche_action_indicateur.fiche_id = enlever_indicateur.fiche_id
          and indicateur_id = indicateur.indicateur_id;
    end if;
end;
$$ language plpgsql;
comment on function enlever_indicateur is 'Enlever une indicateur à la fiche';

create view indicateurs_collectivite as
select
    null as indicateur_id,
    ipd.id as indicateur_personnalise_id,
    ipd.titre as nom,
    ipd.description,
    ipd.unite,
    ipd.collectivite_id
from indicateur_personnalise_definition ipd
union
select
    id.id as tag_id,
    null as indicateur_personnalise_id,
    concat(id.indicateur_group, ' ', id.identifiant, ' - ', id.nom) as nom,
    id.description,
    id.unite,
    null as collectivite_id
from indicateur_definition id;
comment on view indicateurs_collectivite is 'Liste les indicateurs (globaux et personnalisés) d''une collectivite';

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
    fiche_id integer,
    annexe annexe
) returns annexe as $$
declare
    id_annexe integer;
    id_fiche integer;
begin
    id_fiche = fiche_id; -- Ne veut pas prendre ajouter_annexe.fiche_id
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
    fiche_id integer,
    annexe annexe,
    supprimer boolean
) returns void as $$
begin
    delete from fiche_action_annexe
    where fiche_action_annexe.fiche_id = enlever_annexe.fiche_id
      and annexe_id = annexe.id;
    if supprimer then
        delete from annexe where id = annexe.id;
    end if;
end;
$$ language plpgsql;
comment on function enlever_annexe is 'Enlever une annexe à la fiche';



-- Vue listant les fiches actions et ses données liées
create view fiches_action as
select fa.*,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       pi.pilotes,
       re.referents,
       anne.annexes,
       pla.axes,
       act.actions,
       ind.indicateurs
from fiche_action fa
         -- thematiques
         left join lateral (
    select array_agg(th.*::thematique) as thematiques
    from thematique th
             join fiche_action_thematique fath on fath.thematique = th.thematique
    where fath.fiche_id = fa.id
    ) as t on true
    -- sous-thematiques
         left join lateral (
    select array_agg(sth.*::sous_thematique) as sous_thematiques
    from sous_thematique sth
             join fiche_action_sous_thematique fasth on fasth.thematique_id = sth.id
    where fasth.fiche_id = fa.id
    ) as st on true
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
                    fap.tag_id,
                    fap.user_id
             from fiche_action_pilote fap
                      left join personne_tag pt on fap.tag_id = pt.id
                      left join dcp on fap.user_id = dcp.user_id
             where fap.fiche_id = fa.id
         ) pil
    ) as pi on true
    -- referents
         left join lateral (
    select array_agg(ref.*::personne) as referents
    from (
             select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                    pt.collectivite_id,
                    far.tag_id,
                    far.user_id
             from fiche_action_referent far
                      left join personne_tag pt on far.tag_id = pt.id
                      left join dcp on far.user_id = dcp.user_id
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
    select array_agg(indi.*::indicateur_generique) as indicateurs
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
    thematique thematique;
    sous_thematique sous_thematique;
    axe axe;
    partenaire partenaire_tag;
    structure structure_tag;
    pilote personne;
    referent personne;
    action action_relation;
    indicateur indicateur_generique;
    annexe annexe;
begin
    id_fiche = new.id;
    -- Fiche action
    if id_fiche is null then
        insert into fiche_action (titre,
                                  description,
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
        new.id = id_fiche;
    else
        update fiche_action
        set
            titre = new.titre,
            description= new.description,
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

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform ajouter_thematique(id_fiche, thematique.thematique);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform ajouter_sous_thematique(id_fiche, sous_thematique.id);
            end loop;
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
        foreach indicateur in array new.indicateurs::indicateur_generique[]
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
    delete from fiche_action_thematique where fiche_id = old.id;
    delete from fiche_action_sous_thematique where fiche_id = old.id;
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    delete from fiche_action_pilote where fiche_id = old.id;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_annexe where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
    return old;
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
create or replace function plan_action(id integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_nom text; -- Nom du plan d'action courant
    id_loop integer; -- Indice pour parcourir une boucle
    enfants jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    fiches jsonb; -- Fiches actions du plan d'action courant
    to_return jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    fiches = to_jsonb((select array_agg(ff.*)
                       from(
                               select * from fiches_action fa
                                                 join fiche_action_axe fapa on fa.id = fapa.fiche_id
                               where fapa.axe_id = plan_action.id
                               order by fa.modified_at desc
                           )ff)) ;
    pa_nom = (select nom from axe where axe.id = plan_action.id);
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action.id
        order by pa.created_at asc
        loop
            enfants[id_loop] = plan_action(pa_enfant_id);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('id', plan_action.id,
                                   'nom', pa_nom,
                                   'fiches', fiches,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql;
comment on function plan_action is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    ses fiches et ses plans d''actions enfants de manière récursive';

-- Import CSV
create table if not exists fiche_action_import_csv
(
    axe text,
    sous_axe text,
    sous_sous_axe text,
    num_action text,
    titre text,
    description text,
    objectifs text,
    resultats_attendus text,
    cibles text,
    structure_pilote text,
    moyens text,
    partenaires text,
    personne_referente text,
    elu_referent text,
    financements text,
    budget text,
    statut text,
    priorite text,
    date_debut text,
    date_fin text,
    amelioration_continue text,
    calendrier text,
    notes text,
    collectivite_id text,
    plan_nom text
);
alter table fiche_action_import_csv enable row level security;
create policy allow_read on fiche_action_import_csv for select using(is_authenticated());
create policy allow_insert on fiche_action_import_csv for insert with check(have_edition_acces(collectivite_id::integer));
create policy allow_update on fiche_action_import_csv for update using(have_edition_acces(collectivite_id::integer));
create policy allow_delete on fiche_action_import_csv for delete using(have_edition_acces(collectivite_id::integer));


create function upsert_axe(nom text, collectivite_id integer, parent integer) returns integer as
$$
declare
    existing_axe_id integer;
    axe_id integer;
begin
    select a.id from axe a
    where a.nom = trim(upsert_axe.nom)
      and a.collectivite_id =  upsert_axe.collectivite_id
      and ((a.parent is null and upsert_axe.parent is null)
        or (a.parent = upsert_axe.parent))
    limit 1
    into existing_axe_id;
    if existing_axe_id is null then
        insert into axe (nom, collectivite_id, parent)
        values (trim(upsert_axe.nom), upsert_axe.collectivite_id, parent)
        returning id into axe_id;
    else
        axe_id = existing_axe_id;
    end if;
    return axe_id;
end;
$$ language plpgsql;;

create or replace function import_plan_action_csv() returns trigger as
$$
declare
    axe_id integer;
    fiche_id integer;
    elem_id integer;
    elem text;
    col_id integer;
    regex_split text = E'\(et/ou|[–,/+?&;]| - | -|- |^-| et (?!de)\)(?![^(]*[)])(?![^«]*[»])';
    regex_date text = E'^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/([0-9]{4})$';
begin
    col_id = new.collectivite_id::integer;

    -- Fiche action
    insert into fiche_action (titre, description, piliers_eci, objectifs, resultats_attendus, cibles, ressources, financements, budget_previsionnel, statut, niveau_priorite, date_debut, date_fin_provisoire, amelioration_continue, calendrier, notes_complementaires, maj_termine, collectivite_id)
    values (
               left(case when new.num_action ='' then trim(new.titre) else concat(new.num_action, ' - ', trim(new.titre)) end, 300),
               new.description,
               null,
               new.objectifs,
               case when new.resultats_attendus <> '' then regexp_split_to_array(new.resultats_attendus, '-')::fiche_action_resultats_attendus[] else array[]::fiche_action_resultats_attendus[] end,
               case when new.cibles <> '' then regexp_split_to_array(new.cibles, '-')::fiche_action_cibles[] else array[]::fiche_action_cibles[] end,
               new.moyens,
               new.financements,
               case when new.budget <> '' then new.budget::integer end,
               case when new.statut <> '' then trim(new.statut)::fiche_action_statuts end,
               case when new.priorite <> '' then trim(new.priorite)::fiche_action_niveaux_priorite end,
               case when regexp_match(new.date_debut, regex_date) is not null then to_date(trim(new.date_debut), 'DD/MM/YYYY') end,
               case when regexp_match(new.date_fin, regex_date) is not null then to_date(trim(new.date_fin), 'DD/MM/YYYY') end,
               not (new.amelioration_continue = 'FAUX'),
               new.calendrier,
               new.notes,
               true,
               col_id)
    returning id into fiche_id;

    -- Plan et axes
    if new.plan_nom is not null and trim(new.plan_nom) <> '' then
        axe_id = upsert_axe(new.plan_nom, col_id, null);
        if new.axe is not null and trim(new.axe) <> '' then
            axe_id = upsert_axe(new.axe, col_id, axe_id);
            if new.sous_axe is not null and trim(new.sous_axe) <> '' then
                axe_id = upsert_axe(new.sous_axe, col_id, axe_id);
                if new.sous_sous_axe is not null and trim(new.sous_sous_axe) <> '' then
                    axe_id = upsert_axe(new.sous_sous_axe, col_id, axe_id);
                end if;
            end if;
        end if;
    end if;
    if axe_id is not null then
        perform ajouter_fiche_action_dans_un_axe(fiche_id, axe_id);
    end if;

    -- Partenaires
    for elem in select trim(unnest(regexp_split_to_array(new.partenaires, regex_split)))
        loop
            if elem <> '' then
                insert into partenaire_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Structures
    for elem in select trim(unnest(regexp_split_to_array(new.structure_pilote, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into structure_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_structure_tag (fiche_id, structure_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Referents
    for elem in select trim(unnest(regexp_split_to_array(new.elu_referent, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into personne_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_referent (fiche_id, user_id, tag_id)
                values (fiche_id, null, elem_id);
            end if;
        end loop;

    -- Pilotes
    for elem in select trim(unnest(regexp_split_to_array(new.personne_referente, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into personne_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_pilote (fiche_id, user_id, tag_id)
                values (fiche_id, null, elem_id);
            end if;
            return new;
        end loop;
end;
$$ language plpgsql;
comment on function import_plan_action_csv is 'Fonction important un plan d action format csv';

create trigger after_insert_import_csv
    after insert
    on
        fiche_action_import_csv
    for each row
execute procedure import_plan_action_csv();

COMMIT;
