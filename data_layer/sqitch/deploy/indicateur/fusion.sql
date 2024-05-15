-- Deploy tet:indicateur/fusion to pg

BEGIN;

-- Copie les tables indicateurs dans le schéma archive
create table archive.action_impact_indicateur as select * from public.action_impact_indicateur;
create table archive.fiche_action_indicateur as select * from public.fiche_action_indicateur;
create table archive.indicateur_action as select * from public.indicateur_action;
create table archive.indicateur_confidentiel as select * from public.indicateur_confidentiel;
create table archive.indicateur_definition as select * from public.indicateur_definition;
create table archive.indicateur_objectif as select * from public.indicateur_objectif;
create table archive.indicateur_objectif_commentaire as select * from public.indicateur_objectif_commentaire;
create table archive.indicateur_perso_objectif_commentaire as select * from public.indicateur_perso_objectif_commentaire;
create table archive.indicateur_perso_resultat_commentaire as select * from public.indicateur_perso_resultat_commentaire;
create table archive.indicateur_personnalise_definition as select * from public.indicateur_personnalise_definition;
create table archive.indicateur_personnalise_objectif as select * from public.indicateur_personnalise_objectif;
create table archive.indicateur_personnalise_resultat as select * from public.indicateur_personnalise_resultat;
create table archive.indicateur_personnalise_thematique as select * from public.indicateur_personnalise_thematique;
create table archive.indicateur_pilote as select * from public.indicateur_pilote;
create table archive.indicateur_resultat as select * from public.indicateur_resultat;
create table archive.indicateur_resultat_commentaire as select * from public.indicateur_resultat_commentaire;
create table archive.indicateur_resultat_import as select * from public.indicateur_resultat_import;
create table archive.indicateur_service_tag as select * from public.indicateur_service_tag;

-- Supprime les rls utilisant une fonction qui sera supprimée
drop policy allow_read on indicateur_personnalise_thematique;
drop policy allow_update on indicateur_personnalise_thematique;
drop policy allow_delete on indicateur_personnalise_thematique;
drop policy allow_insert on indicateur_personnalise_thematique;
drop policy allow_read on indicateur_personnalise_resultat;
drop policy allow_read on indicateur_resultat;
drop policy allow_read on indicateur_pilote;
drop policy allow_update on indicateur_pilote;
drop policy allow_delete on indicateur_pilote;
drop policy allow_insert on indicateur_pilote;
drop policy allow_read on indicateur_service_tag;
drop policy allow_update on indicateur_service_tag;
drop policy allow_delete on indicateur_service_tag;
drop policy allow_insert on indicateur_service_tag;
drop policy allow_read on indicateur_confidentiel;
drop policy allow_update on indicateur_confidentiel;
drop policy allow_delete on indicateur_confidentiel;
drop policy allow_insert on indicateur_confidentiel;

-- Supprime les éléments concernés par la suppression des tables
drop index indicateur_definition_fts;
drop index indicateur_personnalise_definition_fts;
drop function if exists public.fiche_action_service_tag(fiches_action);
drop function if exists public.fiche_action_structure_tag(fiches_action);
drop function if exists public.fiche_action_personne_tag(fiches_action);
drop function if exists public.fiche_action_pilote(fiches_action);
drop function if exists public.fiche_action_axe(fiches_action);
drop function public.axes;
drop function public.cherchable(indicateur_definition);
drop function public.cherchable(indicateur_definitions); -- Utilise public.indicateur_definitions
drop function public.cherchable(indicateur_personnalise_definition);
drop function public.confidentiel;
drop function public.create_fiche;
drop function public.definition_perso; -- Utilise public.indicateur_definitions
drop trigger delete on public.fiche_action; -- Utilise public.delete_fiche_action
drop function public.delete_fiche_action; -- trigger
drop function if exists public.delete_indicateur_personnalise_definition;
drop function public.enfants(indicateur_definition);
drop function public.enfants(indicateur_definitions); -- Utilise public.indicateur_definitions
drop function public.fiche_resume(fiche_action_indicateur);
drop function public.fiches_non_classees; -- Utilise public.indicateur_definitions
drop function public.import_sources; -- Utilise public.indicateur_definitions
drop function public.indicateur_action; -- Utilise public.indicateur_definitions
drop function public.indicateurs_gaz_effet_serre;
drop function public.personne;
drop function public.pilotes; -- Utilise public.indicateur_defintions
drop function public.plan_action_export; -- Utilise public.fiches_action
drop view public.indicateur_summary; -- Utilise public.rempli et private.rempli
drop function public.rempli(indicateur_definitions); -- Utilise private.rempli
drop trigger rewrite_indicateur_id on public.indicateur_confidentiel; -- Utilise public.rewrite_indicateur_id
drop trigger rewrite_indicateur_id on public.indicateur_objectif; -- Utilise public.rewrite_indicateur_id
drop trigger rewrite_indicateur_id on public.indicateur_pilote; -- Utilise public.rewrite_indicateur_id
drop trigger rewrite_indicateur_id on public.indicateur_resultat; -- Utilise public.rewrite_indicateur_id
drop trigger rewrite_indicateur_id on public.indicateur_service_tag; -- Utilise public.rewrite_indicateur_id
drop trigger rewrite_indicateur_id on public.fiche_action_indicateur; -- Utilise public.rewrite_indicateur_id
drop function public.rewrite_indicateur_id; -- trigger
drop function public.services; -- Utilise public.indicateur_definitions
drop function public.thematiques; -- Utilise public.indicateur_definitions
drop trigger upsert on public.fiches_action; -- Utilise public.upsert_fiche_action
drop function public.upsert_fiche_action; -- Utilise private.ajouter_indicateur & trigger
drop function private.ajouter_indicateur;
drop function private.enlever_indicateur;
drop function private.indicateur_personnalise_collectivite_id;
drop function private.is_valeur_confidentielle(integer, indicateur_id, integer);
drop function private.is_valeur_confidentielle(integer, integer);
drop function private.rempli(integer);
drop function private.rempli(integer, indicateur_id);
drop trigger after_indicateurs_json on indicateurs_json; -- Utilise private.upsert_indicateurs_after_json_insert
drop function if exists private.upsert_indicateurs_after_json_insert; -- Utilise private.upsert_indicateurs & trigger
drop function if exists private.upsert_indicateurs;
drop function stats.refresh_reporting; -- Utilise stats indicateurs
drop function stats.refresh_views; -- Utilise stats indicateurs
drop function stats.refresh_views_crm; -- Utilise stats indicateurs
drop function public.definition_referentiel; -- Utilise public.indicateur_definitions
drop function private.get_personne(indicateur_pilote);
drop function private.can_write(indicateur_pilote);
drop function private.can_read(indicateur_pilote);
drop function private.can_write(indicateur_service_tag);
drop function private.can_read(indicateur_service_tag);
drop function private.can_write(indicateur_confidentiel);
drop function private.can_read(indicateur_confidentiel);
drop view public.crm_indicateurs; -- Utilise stats.crm_indicateurs
drop materialized view stats.crm_indicateurs;
drop view public.crm_usages; -- Utilise stats.crm_usages
drop materialized view stats.crm_usages;
drop view public.fiches_action; -- Utilise private.fiches_action
drop view private.fiches_action;
drop view public.indicateur_definitions;
drop view public.indicateur_rempli;
drop view public.indicateurs;
drop view public.indicateurs_collectivite;
drop view public.stats_evolution_indicateur_referentiel; -- Utilise stats.evolution_indicateur_referentiel
drop materialized view stats.evolution_indicateur_referentiel;
drop view public.stats_evolution_resultat_indicateur_personnalise; -- Utilise stats.evolution_resultat_indicateur_personnalise
drop materialized view stats.evolution_resultat_indicateur_personnalise;
drop view public.stats_evolution_resultat_indicateur_referentiel; -- Utilise stats.evolution_resultat_indicateur_referentiel
drop materialized view stats.evolution_resultat_indicateur_referentiel;
drop view public.stats_locales_evolution_collectivite_avec_indicateur; -- Utilise stats.locales_evolution_collectivite_avec_indicateur_referentiel
drop materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
drop view public.stats_locales_evolution_indicateur_referentiel; -- Utilise stats.locales_evolution_indicateur_referentiel
drop materialized view stats.locales_evolution_indicateur_referentiel;
drop view public.stats_locales_evolution_resultat_indicateur_personnalise; -- Utilise stats.locales_evolution_resultat_indicateur_personnalise
drop materialized view stats.locales_evolution_resultat_indicateur_personnalise;
drop view public.stats_locales_evolution_resultat_indicateur_referentiel; -- Utilise stats.locales_evolution_resultat_indicateur_referentiel
drop materialized view stats.locales_evolution_resultat_indicateur_referentiel;
drop materialized view stats.report_indicateur_personnalise;
drop materialized view stats.report_indicateur_resultat;

-- Supprime les tables indicateurs du schéma public
drop table public.action_impact_indicateur;
drop table public.fiche_action_indicateur;
drop table public.indicateur_action;
drop table public.indicateur_pilote;
drop table public.indicateur_service_tag;
drop table public.indicateur_personnalise_thematique;
drop table public.indicateur_confidentiel;
drop table public.indicateur_resultat;
drop table public.indicateur_resultat_commentaire;
drop table public.indicateur_resultat_import;
drop table public.indicateur_objectif;
drop table public.indicateur_objectif_commentaire;
drop table public.indicateur_definition;
drop table public.indicateur_parent;
drop table public.indicateur_personnalise_resultat;
drop table public.indicateur_perso_resultat_commentaire;
drop table public.indicateur_personnalise_objectif;
drop table public.indicateur_perso_objectif_commentaire;
drop table public.indicateur_personnalise_definition;
drop table public.indicateur_terristory_json;

-- Renomme les types indicateurs en conflit
alter type indicateur_thematique rename to old_indicateur_thematique;

-- CREATION DES TABLES --
-- Modifie la table indicateur_source pour ajouter un attribut ordre
alter table public.indicateur_source add column ordre_affichage integer;

create table public.groupement
(
    id serial primary key,
    nom text not null
);
comment on table public.groupement is 'Groupement de collectivités';

create table public.groupement_collectivite
(
    groupement_id integer references groupement on delete cascade,
    collectivite_id integer references collectivite on delete cascade,
    primary key (groupement_id, collectivite_id)
);
comment on table public.groupement_collectivite is 'Table de passage entre un groupement et ses collectivités';

create table public.indicateur_source_metadonnee
(
    id serial primary key,
    source_id text references indicateur_source not null,
    date_version timestamp not null,
    nom_donnees text,
    diffuseur text,
    producteur text,
    methodologie text,
    limites text
);
comment on table public.indicateur_source_metadonnee is
    'Métadonnées d''une version d''une source pour les indicateurs';

-- Modifie la table indicateur_definition pour accueillir les indicateurs personnalisés
create table public.indicateur_definition
(
    id serial primary key,
    groupement_id integer references public.groupement on delete cascade,
    collectivite_id integer references public.collectivite on delete cascade,
    identifiant_referentiel text,
    titre text not null,
    titre_long text,
    description text,
    unite text not null,
    borne_min double precision,
    borne_max double precision,
    participation_score boolean default false not null,
    sans_valeur_utilisateur boolean default false not null,
    valeur_calcule text,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_by uuid default auth.uid() references auth.users,
    created_by uuid default auth.uid() references auth.users,
    old_id integer,
    unique(identifiant_referentiel)
);
comment on table public.indicateur_definition is
    'Définition d''un indicateur.
    Peut être commun (indicateur prédéfini) ou propre à une collectivité (indicateur personnalisé)';
comment on column public.indicateur_definition.groupement_id is
    'Renseigné si l''indicateur appartient à un groupement de collectivité';
comment on column public.indicateur_definition.collectivite_id is
    'Renseigné si l''indicateur appartient à une collectivité';
comment on column public.indicateur_definition.identifiant_referentiel is
    'Ancien identifiant des indicateurs prédéfinis. Est affiché dans les url et permet une recherche rapide';
comment on column public.indicateur_definition.valeur_calcule is
    'Formule pour calculer automatiquement des valeurs selon les liens de parentés';

create trigger modified_at
    before insert or update
    on indicateur_definition
    for each row
execute procedure update_modified_at();

create trigger modified_by
    before insert or update
    on indicateur_definition
    for each row
execute procedure enforce_modified_by();

create table public.indicateur_valeur
(
    id serial primary key,
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    collectivite_id integer references  public.collectivite on delete cascade not null,
    date_valeur date not null,
    metadonnee_id integer references public.indicateur_source_metadonnee,
    resultat double precision,
    resultat_commentaire text,
    objectif double precision,
    objectif_commentaire text,
    estimation double precision,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_by uuid default auth.uid() references auth.users,
    created_by uuid default auth.uid() references auth.users
);
comment on table public.indicateur_valeur is
    'Valeurs d''un indicateur, d''une collectivité et d''une date
    (et d''une version de source de données dans le cas de valeurs importés)';
comment on column public.indicateur_valeur.metadonnee_id is
    'Lien vers une version d''une source. Renseigné pour des valeurs importés, vide pour des valeurs utilisateur';
comment on column public.indicateur_valeur.resultat is
    'Résultat d''une année et d''un indicateur observé par une collectivité';
comment on column public.indicateur_valeur.objectif is
    'Objectif d''une année et d''un indicateur prévu par une collectivité';
comment on column public.indicateur_valeur.estimation is
    'Estimation du résultat d''une année et d''un indicateur prévu pour une collectivité';

create unique index unique_indicateur_valeur_utilisateur
    on public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur)
    where metadonnee_id is null;

create unique index unique_indicateur_valeur_importee
    on public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id)
    where metadonnee_id is not null;

create trigger modified_at
    before insert or update
    on indicateur_valeur
    for each row
execute procedure update_modified_at();

create trigger modified_by
    before insert or update
    on indicateur_valeur
    for each row
execute procedure enforce_modified_by();

create table public.indicateur_groupe
(
    parent integer references public.indicateur_definition on delete cascade not null,
    enfant integer references public.indicateur_definition on delete cascade not null,
    primary key (parent, enfant)
);
comment on table public.indicateur_groupe is
    'Liens de parenté entre les indicateurs.';

create table public.indicateur_collectivite
(
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    collectivite_id integer references public.collectivite on delete cascade not null,
    commentaire text,
    confidentiel boolean default false not null,
    favoris boolean default false not null,
    primary key (indicateur_id, collectivite_id)
);
comment on table public.indicateur_collectivite is
    'Infos supplémentaire propre à une collectivité pour un indicateur';

create table public.categorie_tag
(
    id serial primary key,
    groupement_id integer references public.groupement on delete cascade,
    collectivite_id integer references public.collectivite on delete cascade,
    nom text not null,
    visible boolean not null default true,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    created_by uuid default auth.uid() references auth.users
);
comment on table public.categorie_tag is
    'Tags décrivant un indicateur
     Peut être commun (défini par TeT) ou propre à une collectivité';
comment on column public.categorie_tag.groupement_id is
    'Renseigné si tag appartenant à un groupement de collectivité';
comment on column public.categorie_tag.collectivite_id is
    'Renseigné si tag appartenant à un collectivité';
comment on column public.categorie_tag.visible is
    'Faux si le tag est défini par TeT et sert à des règles métiers interne';

create table public.indicateur_categorie_tag
(
    categorie_tag_id integer references public.categorie_tag on delete cascade not null,
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    primary key (categorie_tag_id, indicateur_id)
);
comment on table public.indicateur_categorie_tag is
    'Table de passage entre un indicateur et ses catégories';


create table public.indicateur_thematique
(
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    thematique_id  integer references public.thematique on delete cascade not null,
    primary key (indicateur_id, thematique_id)
);
comment on table public.indicateur_thematique is
    'Table de passage entre un indicateur et ses thématiques';

create table public.indicateur_sous_thematique
(
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    sous_thematique_id  integer references public.sous_thematique on delete cascade not null,
    primary key (indicateur_id, sous_thematique_id)
);
comment on table public.indicateur_sous_thematique is
    'Table de passage entre un indicateur et ses sous-thématiques';

create table public.indicateur_service_tag
(
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    service_tag_id integer references public.service_tag on delete cascade not null,
    collectivite_id  integer references public.collectivite on delete cascade not null,
    primary key (indicateur_id, service_tag_id, collectivite_id)
);
comment on table public.indicateur_service_tag is
    'Table de passage entre un indicateur et ses services';

create table public.indicateur_pilote
(
    id serial primary key,
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    user_id             uuid references auth.users on delete cascade,
    tag_id              integer references personne_tag on delete cascade,
    collectivite_id  integer references public.collectivite on delete cascade not null,
    unique (indicateur_id, user_id, tag_id, collectivite_id),
    check((user_id is null and tag_id is not null) or (user_id is not null and tag_id is null))
);
comment on table public.indicateur_pilote is
    'Table de passage entre un indicateur et ses pilotes';

create unique index unique_indicateur_pilote_user
    on indicateur_pilote (indicateur_id, user_id, collectivite_id)
    where user_id is not null;

create unique index unique_indicateur_pilote_tag
    on indicateur_pilote (indicateur_id, tag_id, collectivite_id)
    where tag_id is not null;

create table public.indicateur_action
(
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    action_id action_id references public.action_relation on delete cascade not null,
    primary key (indicateur_id, action_id)
);
comment on table public.indicateur_action is
    'Table de passage entre un indicateur et ses actions';

create table public.fiche_action_indicateur
(
    indicateur_id integer references public.indicateur_definition on delete cascade not null,
    fiche_id integer references public.fiche_action on delete cascade not null,
    primary key (indicateur_id, fiche_id)
);
comment on table public.fiche_action_indicateur is
    'Table de passage entre un indicateur et ses fiches action';

create table action_impact_indicateur
(
    action_impact_id integer not null references action_impact,
    indicateur_id integer not null references indicateur_definition on delete cascade,
    primary key (action_impact_id, indicateur_id)
);
comment on table public.action_impact_indicateur is
    'Table de passage entre un indicateur et ses actions à impact';

-- MIGRATION DONNEES

-- categorie_tag <- indicateur_programme + indicateur_referentiel_type + "prioritaire" (ancien selection)
insert into public.categorie_tag (collectivite_id, nom, visible, created_at, created_by)
values (null, 'clef', true, now(), null),
       (null, 'eci', true, now(), null),
       (null, 'cae', true, now(), null),
       (null, 'pcaet', true, now(), null),
       (null, 'crte', true, now(), null),
       (null, 'resultat', false, now(), null),
       (null, 'impact', false, now(), null),
       (null, 'prioritaire', true, now(), null);

-- indicateur_source_metadonnee <- indicateur_resultat_import
insert into public.indicateur_source_metadonnee(source_id, date_version, nom_donnees)
select s.source_id, now(), s.source
from (select distinct source, source_id from archive.indicateur_resultat_import) s;

-- indicateur_definition <- indicateur_definition + indicateur_personnalise_definition
insert into public.indicateur_definition (collectivite_id, identifiant_referentiel, titre, titre_long, description, unite, borne_min, borne_max, participation_score, sans_valeur_utilisateur, valeur_calcule, modified_at, created_at, modified_by, created_by, old_id)
select null, id, nom, titre_long, description, unite, null, null, participation_score, sans_valeur, null, modified_at, modified_at, null, null, null
from archive.indicateur_definition;

insert into public.indicateur_definition (collectivite_id, identifiant_referentiel, titre, titre_long, description, unite, borne_min, borne_max, participation_score, sans_valeur_utilisateur, valeur_calcule, modified_at, created_at, modified_by, created_by, old_id)
select collectivite_id, null, titre, null, description, unite, null, null, false, false, null, modified_at, modified_at, modified_by, modified_by, id
from archive.indicateur_personnalise_definition;

-- indicateur_categorie_tag <- indicateur_definition.programmes + indicateur_definition.type + indicateur_definition.selection
insert into public.indicateur_categorie_tag (categorie_tag_id, indicateur_id)
select (select categorie_tag.id
        from categorie_tag
        where categorie_tag.nom = aid.programme::text limit 1), pid.id
from (select id, unnest(programmes) as programme from archive.indicateur_definition) aid
join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel;

insert into public.indicateur_categorie_tag (categorie_tag_id, indicateur_id)
select (select categorie_tag.id
        from categorie_tag
        where categorie_tag.nom = aid.type::text limit 1), pid.id
from archive.indicateur_definition aid
join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
where aid.type is not null;

insert into public.indicateur_categorie_tag (categorie_tag_id, indicateur_id)
select (select categorie_tag.id
        from categorie_tag
        where categorie_tag.nom = 'prioritaire' limit 1), pid.id
from archive.indicateur_definition aid
join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
where aid.selection = true;

-- indicateur_valeur <- public.indicateur_resultat + public.indicateur_resultat_commentaire + public.indicateur_resultat_import + public.indicateur_objectif + public.indicateur_objectif_commentaire + public.indicateur_personnalise_resultat + public.indicateur_perso_resultat_commentaire + public.indicateur_personnalise_objectif + public.indicateur_perso_objectif_commentaire
insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, v.valeur, null, null, null
from archive.indicateur_resultat v
join archive.indicateur_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.identifiant_referentiel = coalesce(aid.valeur_indicateur, aid.id)
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do nothing ;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, null, v.commentaire, null, null
from archive.indicateur_resultat_commentaire v
join archive.indicateur_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.identifiant_referentiel = coalesce(aid.valeur_indicateur, aid.id)
where v.annee is not null
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do update
    set resultat_commentaire = excluded.resultat_commentaire;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, null, null, v.valeur, null
from archive.indicateur_objectif v
join archive.indicateur_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.identifiant_referentiel = coalesce(aid.valeur_indicateur, aid.id)
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do update
    set objectif = excluded.objectif;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, null, null, null, v.commentaire
from archive.indicateur_objectif_commentaire v
join archive.indicateur_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.identifiant_referentiel = coalesce(aid.valeur_indicateur, aid.id)
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do update
    set objectif_commentaire = excluded.objectif_commentaire;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, v.valeur, null, null, null
from archive.indicateur_personnalise_resultat v
join archive.indicateur_personnalise_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.old_id = aid.id
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do nothing ;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, null, v.commentaire, null, null
from archive.indicateur_perso_resultat_commentaire v
join archive.indicateur_personnalise_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.old_id = aid.id
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do update
    set resultat_commentaire = excluded.resultat_commentaire;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, null, null, v.valeur, null
from archive.indicateur_personnalise_objectif v
join archive.indicateur_personnalise_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.old_id = aid.id
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do update
    set objectif = excluded.objectif;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), null, null, null, null, v.commentaire
from archive.indicateur_perso_objectif_commentaire v
join archive.indicateur_personnalise_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.old_id = aid.id
on conflict (indicateur_id, collectivite_id, date_valeur) where metadonnee_id is null do update
    set objectif_commentaire = excluded.objectif_commentaire;

insert into public.indicateur_valeur (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, resultat_commentaire, objectif, objectif_commentaire)
select pid.id, v.collectivite_id, to_date(v.annee::varchar, 'yyyy'), aim.id, v.valeur, null, null, null
from archive.indicateur_resultat_import v
join archive.indicateur_definition aid on v.indicateur_id = aid.id
join public.indicateur_definition pid on pid.identifiant_referentiel = coalesce(aid.valeur_indicateur, aid.id)
join public.indicateur_source_metadonnee aim on v.source = aim.source_id and v.source = aim.nom_donnees;

-- indicateur_groupe <- indicateur_definition.parent
insert into public.indicateur_groupe (parent, enfant)
select parent.id, enfant.id
from archive.indicateur_definition aid
join public.indicateur_definition enfant on aid.id = enfant.identifiant_referentiel
join public.indicateur_definition parent on aid.parent = parent.identifiant_referentiel
where aid.parent is not null;

-- fiche_action_indicateur <- fiche_action_indicateur
insert into public.fiche_action_indicateur (fiche_id, indicateur_id)
select afai.fiche_id, pid.id
from archive.fiche_action_indicateur afai
join public.indicateur_definition pid on
    case when afai.indicateur_id is null then
             afai.indicateur_personnalise_id = pid.old_id
         else
             afai.indicateur_id = pid.identifiant_referentiel
    end;

-- action_impact_indicateur <- action_impact_indicateur
insert into public.action_impact_indicateur (action_impact_id, indicateur_id)
select aii.action_impact_id, pid.id
from archive.action_impact_indicateur aii
join public.indicateur_definition pid on aii.indicateur_id = pid.identifiant_referentiel;

-- indicateur_action <- indicateur_action
insert into public.indicateur_action (indicateur_id, action_id)
select pid.id, pia.action_id
from archive.indicateur_action pia
join public.indicateur_definition pid on pia.indicateur_id = pid.identifiant_referentiel;

-- indicateur_pilote <- indicateur_pilote
insert into public.indicateur_pilote (indicateur_id, user_id, tag_id, collectivite_id)
select pid.id, aip.user_id, aip.tag_id, aip.collectivite_id
from archive.indicateur_pilote aip
join public.indicateur_definition pid on
    case when aip.indicateur_id is null then
             aip.indicateur_perso_id = pid.old_id
         else
             aip.indicateur_id = pid.identifiant_referentiel
    end;

-- indicateur_service_tag <- indicateur_service_tag
insert into public.indicateur_service_tag (indicateur_id, service_tag_id, collectivite_id)
select pid.id, aist.service_tag_id, aist.collectivite_id
from archive.indicateur_service_tag aist
join public.indicateur_definition pid on
    case when aist.indicateur_id is null then
             aist.indicateur_perso_id = pid.old_id
         else
             aist.indicateur_id = pid.identifiant_referentiel
    end;

-- indicateur_collectivite <- indicateur_confidentiel + indicateur_resultat_commentaire sans annee
insert into public.indicateur_collectivite (indicateur_id, collectivite_id, commentaire, confidentiel)
select pid.id, aic.collectivite_id, null, true
from archive.indicateur_confidentiel aic
join public.indicateur_definition pid on
    case when aic.indicateur_id is null then
             aic.indicateur_perso_id = pid.old_id
         else
             aic.indicateur_id = pid.identifiant_referentiel
    end;

insert into public.indicateur_collectivite (indicateur_id, collectivite_id, commentaire)
select pid.id, irc.collectivite_id, irc.commentaire
from archive.indicateur_resultat_commentaire irc
join public.indicateur_definition pid on irc.indicateur_id = pid.identifiant_referentiel
where irc.annee is null
on conflict (indicateur_id, collectivite_id) do update
    set commentaire = excluded.commentaire;

-- indicateur_thematique <- public.indicateur_personnalise_thematique + indicateur_definition.thematiques
insert into public.indicateur_thematique (indicateur_id, thematique_id)
select pid.id, aipt.thematique_id
from archive.indicateur_personnalise_thematique aipt
join public.indicateur_definition pid on aipt.indicateur_id = pid.old_id;

insert into public.indicateur_thematique (indicateur_id, thematique_id)
select pid.id, t.id
from (select id, unnest(thematiques) as thematique from archive.indicateur_definition) aid
join public.indicateur_definition pid on aid.id = pid.identifiant_referentiel
join public.thematique t on t.md_id = aid.thematique;

-- Supprime la colonne de migration
alter table indicateur_definition drop column old_id;


-- DROITS --
-- Fonctions de vérification des droits
create function is_indicateur_collectivite(indicateur_id integer, collectivite_id integer)
    returns boolean
as
$$
select count(*)>0
from indicateur_definition id
where id.id = is_indicateur_collectivite.indicateur_id
  and (
    (id.collectivite_id is null and id.groupement_id is null) or
    (id.groupement_id is null and id.collectivite_id = is_indicateur_collectivite.collectivite_id) or
    (is_indicateur_collectivite.collectivite_id in (
                                                   select gc.collectivite_id
                                                   from groupement_collectivite gc
                                                   where gc.groupement_id = id.groupement_id
                                                   ))
    );
$$ language sql security definer;

create function is_indicateur_confidential(indicateur_id integer, collectivite_id integer)
    returns boolean
as
$$
select ic.confidentiel = true
from indicateur_collectivite ic
where ic.collectivite_id = is_indicateur_confidential.collectivite_id
  and ic.indicateur_id = is_indicateur_confidential.indicateur_id;
$$ language sql security definer;

create function peut_lire_l_indicateur(indicateur_id integer)
    returns boolean
as
$$
declare
    indicateur indicateur_definition;
begin
    select *
    from indicateur_definition
    where id = peut_lire_l_indicateur.indicateur_id
    into indicateur;

    if indicateur.collectivite_id is null then
        return is_authenticated();
    elsif is_indicateur_confidential(indicateur.id, indicateur.collectivite_id) then
        return have_lecture_acces(indicateur.collectivite_id);
    else
        return can_read_acces_restreint(indicateur.collectivite_id);
    end if;
end
$$ language plpgsql security definer;

create function peut_modifier_l_indicateur(indicateur_id integer)
    returns boolean
as
$$
select have_edition_acces(collectivite_id)
from indicateur_definition
where id = peut_modifier_l_indicateur.indicateur_id;
$$ language sql security definer;

create function peut_ajouter_une_valeur_a_l_indicateur(indicateur_id integer)
    returns boolean
as
$$
select not sans_valeur_utilisateur
from indicateur_definition
where id = peut_ajouter_une_valeur_a_l_indicateur.indicateur_id;
$$ language sql security definer;

create function peut_lire_la_categorie_d_indicateur(indicateur_id integer, categorie_tag_id integer)
    returns boolean
as
$$
declare
    category categorie_tag;
begin
    if not peut_lire_l_indicateur(peut_lire_la_categorie_d_indicateur.indicateur_id) then
        return false;
    end if;
    select * from categorie_tag where id = peut_lire_la_categorie_d_indicateur.categorie_tag_id into category;

    if category.collectivite_id is null and category.groupement_id is null then
        return category.visible;
    end if;
    if category.groupement_id is null then
        return can_read_acces_restreint(category.collectivite_id);
    end if;
    return (select bool_or(can_read_acces_restreint(collectivite_id))
            from groupement_collectivite
            where groupement_id = category.groupement_id);
end;
$$ language plpgsql security definer;

create function peut_modifier_la_categorie_d_indicateur(indicateur_id integer, categorie_tag_id integer)
    returns boolean
as
$$
declare
    category categorie_tag;
begin
    if not peut_lire_l_indicateur(peut_modifier_la_categorie_d_indicateur.indicateur_id) then
        return false;
    end if;
    select * from categorie_tag where id = peut_modifier_la_categorie_d_indicateur.categorie_tag_id into category;

    if category.collectivite_id is null then
        return false;
    else
        return have_edition_acces(category.collectivite_id);
    end if;
end;
$$ language plpgsql security definer;


-- Row level security
-- DROITS groupement
alter table public.groupement enable row level security;
create policy allow_read on public.groupement for select using (is_authenticated());

alter table public.groupement_collectivite enable row level security;
create policy allow_read on public.groupement_collectivite for select using (is_authenticated());

-- DROITS indicateur_medatonnee
alter table public.indicateur_source_metadonnee enable row level security;
create policy allow_read on public.indicateur_source_metadonnee for select using (is_authenticated());

-- DROITS indicateur_definition
alter table public.indicateur_definition enable row level security;
create policy allow_read on public.indicateur_definition for select using (
    case when collectivite_id is null then
             is_authenticated()
         else
             case when is_indicateur_confidential(id, collectivite_id) then
                      have_lecture_acces(collectivite_id)
                  else
                      can_read_acces_restreint(collectivite_id)
             end
    end
    );
create policy allow_insert on public.indicateur_definition
    for insert with check (have_edition_acces(collectivite_id));
create policy allow_update on public.indicateur_definition
    for update using (have_edition_acces(collectivite_id));
create policy allow_delete on public.indicateur_definition
    for delete using (have_edition_acces(collectivite_id));

-- DROITS indicateur_valeur
alter table public.indicateur_valeur enable row level security;
create policy allow_read on public.indicateur_valeur for select using(
    case when is_indicateur_confidential(indicateur_id, collectivite_id) then
             have_lecture_acces(collectivite_id)
         else
             can_read_acces_restreint(collectivite_id)
    end);
create policy allow_insert on public.indicateur_valeur for insert with check (
    have_edition_acces(collectivite_id) and peut_ajouter_une_valeur_a_l_indicateur(indicateur_id)
        and is_indicateur_collectivite(indicateur_id, collectivite_id));
create policy allow_update on public.indicateur_valeur for update using (
    have_edition_acces(collectivite_id) and peut_ajouter_une_valeur_a_l_indicateur(indicateur_id)
        and is_indicateur_collectivite(indicateur_id, collectivite_id));
create policy allow_delete on public.indicateur_valeur for delete using (
    have_edition_acces(collectivite_id) and peut_ajouter_une_valeur_a_l_indicateur(indicateur_id)
        and is_indicateur_collectivite(indicateur_id, collectivite_id));

-- DROITS indicateur_groupe
alter table public.indicateur_groupe enable row level security;
create policy allow_read on public.indicateur_groupe for select using(
    peut_lire_l_indicateur(parent) and peut_lire_l_indicateur(enfant));
create policy allow_insert on public.indicateur_groupe for insert with check (
    peut_lire_l_indicateur(parent) and peut_lire_l_indicateur(enfant) and
    (peut_modifier_l_indicateur(parent) or peut_modifier_l_indicateur(enfant)));
create policy allow_update on public.indicateur_groupe for update using (
    peut_lire_l_indicateur(parent) and peut_lire_l_indicateur(enfant) and
    (peut_modifier_l_indicateur(parent) or peut_modifier_l_indicateur(enfant)));
create policy allow_delete on public.indicateur_groupe for delete using (
    peut_lire_l_indicateur(parent) and peut_lire_l_indicateur(enfant) and
    (peut_modifier_l_indicateur(parent) or peut_modifier_l_indicateur(enfant)));

-- DROITS indicateur_collectivite
alter table public.indicateur_collectivite enable row level security;
create policy allow_read on public.indicateur_collectivite for select using (
    can_read_acces_restreint(collectivite_id));
create policy allow_insert on public.indicateur_collectivite for insert with check (
    have_edition_acces(collectivite_id));
create policy allow_update on public.indicateur_collectivite for update using (
    have_edition_acces(collectivite_id));
create policy allow_delete on public.indicateur_collectivite for delete using (
    have_edition_acces(collectivite_id));

-- DROITS categorie_tag
alter table public.categorie_tag enable row level security;
create policy allow_read on public.categorie_tag for select using (
    case when collectivite_id is null then
             is_authenticated()
         else
             can_read_acces_restreint(collectivite_id)
    end);
create policy allow_insert on public.categorie_tag for insert with check (have_edition_acces(collectivite_id));
create policy allow_update on public.categorie_tag for update using (have_edition_acces(collectivite_id));
create policy allow_delete on public.categorie_tag for delete using (have_edition_acces(collectivite_id));

-- DROITS indicateur_categorie_tag
alter table public.indicateur_categorie_tag enable row level security;
create policy allow_read on public.indicateur_categorie_tag for select using (
    peut_lire_la_categorie_d_indicateur(
            indicateur_categorie_tag.indicateur_id, categorie_tag_id));
create policy allow_insert on public.indicateur_categorie_tag for insert with check (
    peut_modifier_la_categorie_d_indicateur(
            indicateur_categorie_tag.indicateur_id, categorie_tag_id));
create policy allow_update on public.indicateur_categorie_tag for update using (
    peut_modifier_la_categorie_d_indicateur(
            indicateur_categorie_tag.indicateur_id, categorie_tag_id));
create policy allow_delete on public.indicateur_categorie_tag for delete using (
    peut_modifier_la_categorie_d_indicateur(
            indicateur_categorie_tag.indicateur_id, categorie_tag_id));

-- DROITS indicateur_thematique
alter table public.indicateur_thematique enable row level security;
create policy allow_read on public.indicateur_thematique for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.indicateur_thematique for insert with check (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_update on public.indicateur_thematique for update using (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_delete on public.indicateur_thematique for delete using (
    peut_modifier_l_indicateur(indicateur_id));

-- DROITS indicateur_sous_thematique
alter table public.indicateur_sous_thematique enable row level security;
create policy allow_read on public.indicateur_sous_thematique for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.indicateur_sous_thematique for insert with check (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_update on public.indicateur_sous_thematique for update using (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_delete on public.indicateur_sous_thematique for delete using (
    peut_modifier_l_indicateur(indicateur_id));

-- DROITS indicateur_service_tag
alter table public.indicateur_service_tag enable row level security;
create policy allow_read on public.indicateur_service_tag for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.indicateur_service_tag for insert with check (
    peut_lire_l_indicateur(indicateur_id) and have_edition_acces(collectivite_id));
create policy allow_update on public.indicateur_service_tag for update using (
    peut_lire_l_indicateur(indicateur_id) and have_edition_acces(collectivite_id));
create policy allow_delete on public.indicateur_service_tag for delete using (
    peut_lire_l_indicateur(indicateur_id) and have_edition_acces(collectivite_id));

-- DROITS indicateur_pilote
alter table public.indicateur_pilote enable row level security;
create policy allow_read on public.indicateur_pilote for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.indicateur_pilote for insert with check (
    peut_lire_l_indicateur(indicateur_id) and have_edition_acces(collectivite_id));
create policy allow_update on public.indicateur_pilote for update using (
    peut_lire_l_indicateur(indicateur_id) and have_edition_acces(collectivite_id));
create policy allow_delete on public.indicateur_pilote for delete using (
    peut_lire_l_indicateur(indicateur_id) and have_edition_acces(collectivite_id));

-- DROITS indicateur_action
alter table public.indicateur_action enable row level security;
create policy allow_read on public.indicateur_action for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.indicateur_action for insert with check (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_update on public.indicateur_action for update using (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_delete on public.indicateur_action for delete using (
    peut_modifier_l_indicateur(indicateur_id));

-- DROITS fiche_action_indicateur
alter table public.fiche_action_indicateur enable row level security;
create policy allow_read on public.fiche_action_indicateur for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.fiche_action_indicateur for insert with check (
    peut_lire_l_indicateur(indicateur_id) and peut_modifier_la_fiche(fiche_id));
create policy allow_update on public.fiche_action_indicateur for update using (
    peut_lire_l_indicateur(indicateur_id) and peut_modifier_la_fiche(fiche_id));
create policy allow_delete on public.fiche_action_indicateur for delete using (
    peut_lire_l_indicateur(indicateur_id) and peut_modifier_la_fiche(fiche_id));

-- DROITS action_impact_indicateur
alter table public.action_impact_indicateur enable row level security;
create policy allow_read on public.action_impact_indicateur for select using (
    peut_lire_l_indicateur(indicateur_id));
create policy allow_insert on public.action_impact_indicateur for insert with check (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_update on public.action_impact_indicateur for update using (
    peut_modifier_l_indicateur(indicateur_id));
create policy allow_delete on public.action_impact_indicateur for delete using (
    peut_modifier_l_indicateur(indicateur_id));

-- Recrée les éléments indirectement concernés

-- stats.report_indicateur_resultat;
create materialized view stats.report_indicateur_resultat as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       ir.indicateur_id,
       extract(year from ir.date_valeur) as annee,
       ir.resultat
FROM stats.collectivite c
JOIN indicateur_valeur ir USING (collectivite_id)
WHERE ir.resultat IS NOT NULL
ORDER BY c.collectivite_id, ir.date_valeur;

-- stats.report_indicateur_personnalise;
create materialized view stats.report_indicateur_personnalise as
SELECT ipd.collectivite_id,
       ipd.titre,
       ipd.description,
       ipd.unite,
       ic.commentaire,
       count(ipo.*) filter (where ipo.objectif is not null) AS objectifs,
       count(ipo.*) filter (where ipo.resultat is not null) AS resultats
FROM indicateur_definition ipd
LEFT JOIN indicateur_collectivite ic on ipd.id = ic.indicateur_id and ipd.collectivite_id = ic.collectivite_id
LEFT JOIN indicateur_valeur ipo ON ipd.id = ipo.indicateur_id
WHERE ipd.collectivite_id is not null
GROUP BY ipd.collectivite_id, ipd.titre, ipd.description, ipd.unite, ic.commentaire;


-- stats.locales_evolution_resultat_indicateur_referentiel;
create materialized view stats.locales_evolution_resultat_indicateur_referentiel as
WITH resultats AS (
                  SELECT iv.collectivite_id,
                         sc.region_code,
                         sc.departement_code,
                         iv.modified_at
                  FROM indicateur_valeur iv
                  JOIN indicateur_definition id on iv.indicateur_id = id.id
                  JOIN stats.collectivite sc on sc.collectivite_id = iv.collectivite_id
                  WHERE iv.resultat is not null
                    AND id.collectivite_id is null
                  )
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN resultats i ON i.modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code
ORDER BY 1;


-- public.stats_locales_evolution_resultat_indicateur_referentiel;
create view public.stats_locales_evolution_resultat_indicateur_referentiel as
SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats.locales_evolution_resultat_indicateur_referentiel;

-- stats.locales_evolution_resultat_indicateur_personnalise;
create materialized view stats.locales_evolution_resultat_indicateur_personnalise as
WITH resultats AS (
                  SELECT iv.collectivite_id,
                         sc.region_code,
                         sc.departement_code,
                         iv.modified_at
                  FROM indicateur_valeur iv
                  JOIN indicateur_definition id on iv.indicateur_id = id.id
                  JOIN stats.collectivite sc on iv.collectivite_id = sc.collectivite_id
                  WHERE iv.resultat is not null
                    AND id.collectivite_id is not null
                  )
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN resultats i ON i.modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
JOIN stats.monthly_bucket m ON true
LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code
ORDER BY 1;


-- public.stats_locales_evolution_resultat_indicateur_personnalise;
create view public.stats_locales_evolution_resultat_indicateur_personnalise  as
SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats.locales_evolution_resultat_indicateur_personnalise;

-- stats.locales_evolution_indicateur_referentiel;
create materialized view stats.locales_evolution_indicateur_referentiel as
WITH indicateurs AS (
                    SELECT iv.collectivite_id,
                           sc.region_code,
                           sc.departement_code,
                           iv.indicateur_id,
                           min(iv.modified_at) AS first_modified_at
                    FROM indicateur_valeur iv
                    JOIN stats.collectivite sc on iv.collectivite_id = sc.collectivite_id
                    JOIN indicateur_definition id on iv.indicateur_id = id.id
                    WHERE iv.resultat is not null
                      AND id.collectivite_id is null
                    GROUP BY iv.collectivite_id, sc.region_code,
                             sc.departement_code, iv.indicateur_id
                    )
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
JOIN stats.monthly_bucket m ON true
LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
JOIN stats.monthly_bucket m ON true
LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code;


-- public.stats_locales_evolution_indicateur_referentiel;
create view public.stats_locales_evolution_indicateur_referentiel as
SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats.locales_evolution_indicateur_referentiel;

-- stats.locales_evolution_collectivite_avec_indicateur_referentiel;
create materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel as
WITH indicateur_collectivite AS (
                                SELECT mb.first_day                                                               AS mois,
                                       c.collectivite_id,
                                       c.region_code,
                                       c.departement_code,
                                       COALESCE(count(*) FILTER (WHERE ir.modified_at <= mb.last_day),
                                                0::bigint)                                                        AS resultats
                                FROM stats.monthly_bucket mb
                                JOIN stats.collectivite c ON true
                                LEFT JOIN (select iv.*
                                           from indicateur_valeur iv
                                           join indicateur_definition id on iv.indicateur_id = id.id
                                           where id.collectivite_id is null
                                             and iv.resultat is not null)
                                    ir USING (collectivite_id)
                                GROUP BY mb.first_day, c.collectivite_id, c.departement_code, c.region_code
                                )
SELECT indicateur_collectivite.mois,
       NULL::character varying(2)                                    AS code_region,
       NULL::character varying(2)                                    AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois
UNION ALL
SELECT indicateur_collectivite.mois,
       indicateur_collectivite.region_code                           AS code_region,
       NULL::character varying                                       AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.region_code
UNION ALL
SELECT indicateur_collectivite.mois,
       NULL::character varying                                       AS code_region,
       indicateur_collectivite.departement_code                      AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.departement_code
ORDER BY 1;

--  public.stats_locales_evolution_collectivite_avec_indicateur;
create view public.stats_locales_evolution_collectivite_avec_indicateur as
SELECT mois,
       code_region,
       code_departement,
       collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel;

-- stats.evolution_resultat_indicateur_referentiel;
create materialized view stats.evolution_resultat_indicateur_referentiel as
SELECT m.first_day AS mois,
       count(*)    AS resultats
FROM stats.monthly_bucket m
LEFT JOIN (select iv.*
           from indicateur_valeur iv
           join indicateur_definition id on iv.indicateur_id = id.id
           where iv.resultat is not null
             and id.collectivite_id is null) ir
          ON ir.modified_at <= m.last_day
JOIN stats.collectivite_active USING (collectivite_id)
GROUP BY m.first_day
ORDER BY m.first_day;

-- public.stats_evolution_resultat_indicateur_referentiel;
create view public.stats_evolution_resultat_indicateur_referentiel as
SELECT mois,
       resultats
FROM stats.evolution_resultat_indicateur_referentiel;

-- stats.evolution_resultat_indicateur_personnalise;
create materialized view stats.evolution_resultat_indicateur_personnalise as
SELECT m.first_day AS mois,
       count(*)    AS resultats
FROM stats.monthly_bucket m
LEFT JOIN (select iv.*
           from indicateur_valeur iv
           join indicateur_definition id on iv.indicateur_id = id.id
           where iv.resultat is not null
             and id.collectivite_id is not null)
    ipr ON ipr.modified_at <= m.last_day
JOIN stats.collectivite_active USING (collectivite_id)
GROUP BY m.first_day
ORDER BY m.first_day;

-- public.stats_evolution_resultat_indicateur_personnalise;
create view public.stats_evolution_resultat_indicateur_personnalise as
SELECT mois,
       resultats
FROM stats.evolution_resultat_indicateur_personnalise;

-- stats.evolution_indicateur_referentiel;
create materialized view stats.evolution_indicateur_referentiel as
WITH indicateurs AS (
                    SELECT iv.collectivite_id,
                           iv.indicateur_id,
                           min(iv.modified_at) AS first_modified_at
                    FROM indicateur_valeur iv
                    JOIN indicateur_definition id on iv.indicateur_id = id.id
                    JOIN stats.collectivite_active sc on iv.collectivite_id = sc.collectivite_id
                    WHERE iv.resultat is not null
                      AND id.collectivite_id is null
                    GROUP BY iv.collectivite_id, iv.indicateur_id
                    )
SELECT m.first_day AS mois,
       count(*)    AS indicateurs
FROM stats.monthly_bucket m
LEFT JOIN indicateurs ON indicateurs.first_modified_at <= m.last_day
GROUP BY m.first_day
ORDER BY m.first_day;


-- public.stats_evolution_indicateur_referentiel;
create view public.stats_evolution_indicateur_referentiel as
SELECT mois,
       indicateurs
FROM stats.evolution_indicateur_referentiel;

-- private.fiches_action;
create view private.fiches_action as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       fa.resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
              LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
              LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil)  AS pilotes,
       (SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              FROM fiche_action_referent far
              LEFT JOIN personne_tag pt ON far.tag_id = pt.id
              LEFT JOIN dcp ON far.user_id = dcp.user_id
              WHERE far.fiche_id = fa.id) ref)  AS referents,
       pla.axes,
       act.actions,
       (SELECT array_agg(indi.*::indicateur_definition) AS array_agg
        FROM (SELECT id.*
              FROM fiche_action_indicateur fai
              JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
              WHERE fai.fiche_id = fa.id) indi) AS indicateurs,
       ser.services,
       (SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
        FROM (SELECT ft.*::financeur_tag AS financeur_tag,
                     faft.montant_ttc,
                     faft.id
              FROM financeur_tag ft
              JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
              WHERE faft.fiche_id = fa.id) fin) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (SELECT fath.fiche_id,
                  array_agg(th.*) AS thematiques
           FROM thematique th
           JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
           GROUP BY fath.fiche_id) t ON t.fiche_id = fa.id
LEFT JOIN (SELECT fasth.fiche_id,
                  array_agg(sth.*) AS sous_thematiques
           FROM sous_thematique sth
           JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
           GROUP BY fasth.fiche_id) st ON st.fiche_id = fa.id
LEFT JOIN (SELECT fapt.fiche_id,
                  array_agg(pt.*) AS partenaires
           FROM partenaire_tag pt
           JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
           GROUP BY fapt.fiche_id) p ON p.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS structures
           FROM structure_tag st_1
           JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
           GROUP BY fast.fiche_id) s ON s.fiche_id = fa.id
LEFT JOIN (SELECT fapa.fiche_id,
                  array_agg(pa.*) AS axes
           FROM axe pa
           JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
           GROUP BY fapa.fiche_id) pla ON pla.fiche_id = fa.id
LEFT JOIN (SELECT faa.fiche_id,
                  array_agg(ar.*) AS actions
           FROM action_relation ar
           JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
           GROUP BY faa.fiche_id) act ON act.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS services
           FROM service_tag st_1
           JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
           GROUP BY fast.fiche_id) ser ON ser.fiche_id = fa.id
LEFT JOIN (SELECT falpf.fiche_id,
                  array_agg(fr.*) AS fiches_liees
           FROM private.fiche_resume fr
           JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
           GROUP BY falpf.fiche_id) fic ON fic.fiche_id = fa.id;

-- public.fiches_action;
create view public.fiches_action as
SELECT fiches_action.modified_at,
       fiches_action.id,
       fiches_action.titre,
       fiches_action.description,
       fiches_action.piliers_eci,
       fiches_action.objectifs,
       fiches_action.resultats_attendus,
       fiches_action.cibles,
       fiches_action.ressources,
       fiches_action.financements,
       fiches_action.budget_previsionnel,
       fiches_action.statut,
       fiches_action.niveau_priorite,
       fiches_action.date_debut,
       fiches_action.date_fin_provisoire,
       fiches_action.amelioration_continue,
       fiches_action.calendrier,
       fiches_action.notes_complementaires,
       fiches_action.maj_termine,
       fiches_action.collectivite_id,
       fiches_action.created_at,
       fiches_action.modified_by,
       fiches_action.thematiques,
       fiches_action.sous_thematiques,
       fiches_action.partenaires,
       fiches_action.structures,
       fiches_action.pilotes,
       fiches_action.referents,
       fiches_action.axes,
       fiches_action.actions,
       fiches_action.indicateurs,
       fiches_action.services,
       fiches_action.financeurs,
       fiches_action.fiches_liees,
       fiches_action.restreint
FROM private.fiches_action
WHERE CASE
          WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
          ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;


-- stats.crm_usages;
create materialized view stats.crm_usages as
WITH premier_rattachements AS (
                              SELECT private_utilisateur_droit.collectivite_id,
                                     min(private_utilisateur_droit.created_at)::date AS date
                              FROM private_utilisateur_droit
                              WHERE private_utilisateur_droit.active
                              GROUP BY private_utilisateur_droit.collectivite_id
                              ),
     comptes AS (
                              SELECT c_1.collectivite_id,
                                     (
                                     SELECT count(*) AS count
                                     FROM fiche_action x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                     ) AS fiches,
                                     (
                                     SELECT count(*) AS count
                                     FROM axe x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.parent IS NULL
                                     ) AS plans,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_valeur x_1
                                     JOIN indicateur_definition id on x_1.indicateur_id = id.id
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.resultat is not null
                                       AND id.collectivite_id is null
                                     ) AS resultats_indicateurs,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_definition x_1
                                     WHERE x_1.collectivite_id is not null
                                       AND x_1.collectivite_id = c_1.collectivite_id
                                     ) AS indicateurs_perso,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_valeur x_1
                                     JOIN indicateur_definition id on x_1.indicateur_id = id.id
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.resultat is not null
                                       AND id.collectivite_id is not null
                                     ) AS resultats_indicateurs_perso
                              FROM stats.collectivite c_1
                              )
SELECT c.collectivite_id,
       ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text AS key,
       pc.completude_eci,
       pc.completude_cae,
       x.fiches,
       x.plans,
       x.resultats_indicateurs,
       x.indicateurs_perso,
       x.resultats_indicateurs_perso,
       pr.date                                                         AS premier_rattachement,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.titre IS NOT NULL
         AND (f.description IS NOT NULL OR f.objectifs IS NOT NULL)
       )                                                               AS fiches_initiees,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_debut IS NOT NULL OR
              f.date_fin_provisoire IS NOT NULL OR (f.id IN (
                                                            SELECT fiche_action_structure_tag.fiche_id
                                                            FROM fiche_action_structure_tag
                                                            )) OR (f.id IN (
                                                                           SELECT st.fiche_id
                                                                           FROM fiche_action_pilote st
                                                                           )) OR (f.id IN (
                                                                                          SELECT fiche_action_service_tag.fiche_id
                                                                                          FROM fiche_action_service_tag
                                                                                          )))
       )                                                               AS fiches_pilotage,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiche_action_indicateur.fiche_id
                      FROM fiche_action_indicateur
                      ))
       )                                                               AS fiches_indicateur,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiche_action_action.fiche_id
                      FROM fiche_action_action
                      ))
       )                                                               AS fiches_action_referentiel,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiches_liees_par_fiche.fiche_id
                      FROM fiches_liees_par_fiche
                      ))
       )                                                               AS fiches_fiche_liee,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '1 mon'::interval)
       )                                                               AS fiches_mod_1mois,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '3 mons'::interval)
       )                                                               AS fiches_mod_3mois,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS fiches_mod_6mois,
       (
       SELECT min(f.created_at) AS min
       FROM (
            SELECT p.created_at,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id, p.created_at
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_date_creation,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '1 mon'::interval)
       )                                                               AS pa_view_1mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '3 mons'::interval)
       )                                                               AS pa_view_3mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS pa_view_6mois,
       (
       SELECT count(*) AS count
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_non_vides,
       (
       SELECT count(*) AS count
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_pilote fap ON f_1.id = fap.fiche_id
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND f_1.statut IS NOT NULL
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_pilotables,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
       )                                                               AS fiches_non_vides,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
         AND f.statut IS NOT NULL
       )                                                               AS fiches_pilotables,
       (
       SELECT count(*) > 4
       FROM fiche_action f
       LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
         AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_fin_provisoire IS NOT NULL OR
              fap.* IS NOT NULL)
       )                                                               AS _5fiches_1pilotage,
       (
       SELECT count(*) AS count
       FROM historique.fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.previous_statut <> f.statut OR f.previous_statut IS NULL AND f.statut IS NOT NULL OR
              f.previous_statut IS NOT NULL AND f.statut IS NULL)
         AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS fiches_changement_statut,
       CASE
           WHEN x.fiches = 0 THEN 0::numeric
           ELSE ((
                 SELECT count(*) AS count
                 FROM fiche_action f
                 WHERE f.collectivite_id = c.collectivite_id
                   AND f.restreint = true
                 )
                )::numeric / x.fiches::numeric * 100::numeric
       END                                                             AS pourcentage_fa_privee,
       CASE
           WHEN x.fiches = 0 THEN 0::numeric
           ELSE ((
                 SELECT count(*) AS count
                 FROM fiche_action f
                 JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                 WHERE f.collectivite_id = c.collectivite_id
                   AND f.restreint = true
                   AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
                   AND f.statut IS NOT NULL
                 )
                )::numeric / x.fiches::numeric * 100::numeric
       END                                                             AS pourcentage_fa_pilotable_privee,
       (
       SELECT count(ic.*) AS count
       FROM indicateur_collectivite ic
       WHERE ic.collectivite_id = c.collectivite_id
         AND ic.confidentiel = true
       )                                                               AS indicateur_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_collectivite ic
       WHERE ic.collectivite_id = c.collectivite_id
         AND ic.confidentiel = true
       )                                                               AS min1_indicateur_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_collectivite ic
       JOIN indicateur_definition id on ic.indicateur_id = id.id
       WHERE ic.collectivite_id = c.collectivite_id
         AND id.collectivite_id is null
         AND ic.confidentiel = true
       )                                                               AS min1_indicateur_predef_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_collectivite ic
       JOIN indicateur_definition id on ic.indicateur_id = id.id
       WHERE ic.collectivite_id = c.collectivite_id
         AND id.collectivite_id is not null
         AND ic.confidentiel = true
       )                                                               AS min1_indicateur_perso_prive,
       (
       SELECT i.pourcentage
       FROM (
            SELECT c_1.id                                                                      AS collectivite_id,
                   case when ((
                              SELECT count(*) AS count
                              FROM indicateur_definition
                              WHERE collectivite_id is null
                              )
                             ) = 0 then 0::double precision
                       else
                   count(ic.*)::double precision / ((
                                                    SELECT count(*) AS count
                                                    FROM indicateur_definition
                                                    WHERE collectivite_id is null
                                                    )
                                                   )::double precision * 100::double precision
                       end AS pourcentage
            FROM collectivite c_1
            LEFT JOIN (select i.* from indicateur_collectivite i
            join indicateur_definition id on i.indicateur_id = id.id
                       where i.confidentiel = true
                         and id.collectivite_id is null) ic
                      ON ic.collectivite_id = c_1.id
            GROUP BY c_1.id
            ) i
       WHERE i.collectivite_id = c.collectivite_id
       )                                                               AS pourcentage_indicateur_predef_prives,
       (
       SELECT array_agg(DISTINCT pat.type) AS array_agg
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_pilote fap ON f_1.id = fap.fiche_id
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a_1 ON a_1.id = faa.axe_id
            JOIN axe p ON a_1.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND f_1.statut IS NOT NULL
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       JOIN axe a ON f.id = a.id
       LEFT JOIN plan_action_type pat ON a.type = pat.id
       WHERE f.nb_fiche > 4
       )                                                               AS type_pa
FROM stats.collectivite c
JOIN stats.collectivite_active USING (collectivite_id)
LEFT JOIN comptes x USING (collectivite_id)
LEFT JOIN stats.pourcentage_completude pc USING (collectivite_id)
LEFT JOIN premier_rattachements pr USING (collectivite_id)
ORDER BY c.nom;
comment on column stats.crm_usages.pa_date_creation is 'Date de création du premier plan (avec +5 FA non vides) pour chaque collectivité concernées';
comment on column stats.crm_usages.pa_view_1mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours du mois dernier';
comment on column stats.crm_usages.pa_view_3mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 3 derniers mois';
comment on column stats.crm_usages.pa_view_6mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 6 derniers mois.';
comment on column stats.crm_usages.pa_non_vides is 'Nombre de plans non vides (minimum un titre de PA et 5 FA non vides)';
comment on column stats.crm_usages.pa_pilotables is 'Nombre de plans “pilotables” (= avec min. 5 FA, qui ont à minima, le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages.fiches_non_vides is 'Nombre de fiches actions non vides';
comment on column stats.crm_usages.fiches_pilotables is 'Nombre de fiches actions pilotables ( = à minima le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages._5fiches_1pilotage is 'Nombre de collectivités qui ont au moins 5 FA avec au moins le titre + 1 critère de pilotage renseigné (soit statut ou priorité ou date prévisionnelle ou responsable)';
comment on column stats.crm_usages.fiches_changement_statut is 'Nombre de changements de statut de fiches actions dans les 6 derniers mois par collectivité (tous les status)';
comment on column stats.crm_usages.pourcentage_fa_privee is '% de fiches action privées par collectivité';
comment on column stats.crm_usages.pourcentage_fa_pilotable_privee is '% de fiches action pilotables privées (avec au moins un titre rempli, le pilote et le statut)';
comment on column stats.crm_usages.indicateur_prive is 'Nombre d''indicateurs privés par collectivité';
comment on column stats.crm_usages.min1_indicateur_prive is 'Vrai si au moins un indicateur privé';
comment on column stats.crm_usages.min1_indicateur_predef_prive is 'Vrai si au moins un indicateur prédéfini privé';
comment on column stats.crm_usages.min1_indicateur_perso_prive is 'Vrai si au moins un indicateur perso privé';
comment on column stats.crm_usages.pourcentage_indicateur_predef_prives is '% d''indicateur prédéfini privé par collectivité';
comment on column stats.crm_usages.type_pa is 'Liste de tous les types des plans pilotables de la collectivité';

-- public.crm_usages;
create view public.crm_usages as
SELECT crm_usages.collectivite_id,
       crm_usages.key,
       crm_usages.completude_eci,
       crm_usages.completude_cae,
       crm_usages.fiches,
       crm_usages.plans,
       crm_usages.resultats_indicateurs,
       crm_usages.indicateurs_perso,
       crm_usages.resultats_indicateurs_perso,
       crm_usages.premier_rattachement,
       crm_usages.fiches_initiees,
       crm_usages.fiches_pilotage,
       crm_usages.fiches_indicateur,
       crm_usages.fiches_action_referentiel,
       crm_usages.fiches_fiche_liee,
       crm_usages.fiches_mod_1mois,
       crm_usages.fiches_mod_3mois,
       crm_usages.fiches_mod_6mois,
       crm_usages.pa_date_creation,
       crm_usages.pa_view_1mois,
       crm_usages.pa_view_3mois,
       crm_usages.pa_view_6mois,
       crm_usages.pa_non_vides,
       crm_usages.pa_pilotables,
       crm_usages.fiches_non_vides,
       crm_usages.fiches_pilotables,
       crm_usages._5fiches_1pilotage,
       crm_usages.fiches_changement_statut,
       crm_usages.pourcentage_fa_privee,
       crm_usages.pourcentage_fa_pilotable_privee,
       crm_usages.indicateur_prive,
       crm_usages.min1_indicateur_prive,
       crm_usages.min1_indicateur_predef_prive,
       crm_usages.min1_indicateur_perso_prive,
       crm_usages.pourcentage_indicateur_predef_prives,
       crm_usages.type_pa
FROM stats.crm_usages
WHERE is_service_role();

-- stats.crm_indicateurs;
create materialized view stats.crm_indicateurs as
SELECT i.id,
       id.titre,
       i.nb_prive,
       i.nb_prive::double precision / ((
                                       SELECT count(*) AS count
                                       FROM indicateur_definition
                                       WHERE collectivite_id is null
                                       )
                                      )::double precision * 100::double precision AS pourcentage_prive
FROM (
     SELECT id_1.id,
            count(ic.*) FILTER (WHERE ic.confidentiel = true) AS nb_prive
     FROM indicateur_definition id_1
     LEFT JOIN indicateur_collectivite ic ON id_1.id = ic.indicateur_id
     WHERE id_1.collectivite_id is null
     GROUP BY id_1.id
     ) i
JOIN indicateur_definition id ON i.id = id.id
ORDER BY i.nb_prive DESC;


-- public.crm_indicateurs;
create view public.crm_indicateurs as
SELECT id,
       titre,
       nb_prive,
       pourcentage_prive
FROM stats.crm_indicateurs
WHERE is_service_role();


-- stats.refresh_views_crm;
create function stats.refresh_views_crm() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.crm_usages;
    refresh materialized view stats.crm_indicateurs;
    refresh materialized view stats.crm_plans;
end ;
$$;

-- stats.refresh_views;
create function stats.refresh_views() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
    refresh materialized view stats.evolution_activation;
    refresh materialized view stats.rattachement;
    refresh materialized view stats.utilisateur;
    refresh materialized view stats.evolution_utilisateur;
    refresh materialized view stats.connection;
    refresh materialized view stats.evolution_connection;
    refresh materialized view stats.carte_collectivite_active;
    refresh materialized view stats.evolution_total_activation_par_type;
    refresh materialized view stats.collectivite_actives_et_total_par_type;
    refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.carte_epci_par_departement;
    refresh materialized view stats.pourcentage_completude;
    refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
    refresh materialized view stats.evolution_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.engagement_collectivite;
    refresh materialized view stats.evolution_nombre_fiches;
    refresh materialized view stats.evolution_nombre_plans;
    refresh materialized view stats.evolution_nombre_labellisations;
end ;
$$;


-- stats.refresh_reporting;
create function stats.refresh_reporting() returns void
    language plpgsql
as
$$
begin
    refresh materialized view stats.report_scores;
    refresh materialized view stats.report_reponse_choix;
    refresh materialized view stats.report_reponse_binaire;
    refresh materialized view stats.report_reponse_proportion;
    refresh materialized view stats.report_indicateur_resultat;
    refresh materialized view stats.report_indicateur_personnalise;
end;
$$;
comment on function stats.refresh_reporting() is 'Rafraichit les vues matérialisées.';

-- private.enlever_indicateur;
create function private.enlever_indicateur(fiche_id integer, indicateur indicateur_definition) returns void
    language plpgsql
as
$$
begin
    delete from fiche_action_indicateur
    where fiche_action_indicateur.fiche_id = enlever_indicateur.fiche_id
      and fiche_action_indicateur.indicateur_id = enlever_indicateur.indicateur.id;
end;
$$;
comment on function private.enlever_indicateur(integer, indicateur_definition) is 'Enlever une indicateur à la fiche';

-- private.ajouter_indicateur;
create function private.ajouter_indicateur(fiche_id integer, indicateur indicateur_definition) returns void
    language plpgsql
as
$$
begin
    insert into fiche_action_indicateur (fiche_id, indicateur_id)
    values (ajouter_indicateur.fiche_id, indicateur.id);
end;
$$;


-- public.upsert_fiche_action;
create function public.upsert_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
    id_fiche        integer;
    thematique      thematique;
    sous_thematique sous_thematique;
    axe             axe;
    partenaire      partenaire_tag;
    structure       structure_tag;
    pilote          personne;
    referent        personne;
    action          action_relation;
    indicateur      indicateur_definition;
    service         service_tag;
    financeur       financeur_montant;
    fiche_liee      fiche_resume;
begin
    id_fiche = new.id;
    if not have_edition_acces(new.collectivite_id) and not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Modification non autorisé.';
    end if;
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
                                  collectivite_id,
                                  restreint)
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
                new.collectivite_id,
                new.restreint)
        returning id into id_fiche;
        new.id = id_fiche;
    else
        update fiche_action
        set titre                = new.titre,
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
            collectivite_id      = new.collectivite_id,
            restreint            = new.restreint
        where id = id_fiche;
    end if;

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform private.ajouter_thematique(id_fiche, thematique.nom);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform private.ajouter_sous_thematique(id_fiche, sous_thematique.id);
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
                perform private.ajouter_partenaire(id_fiche, partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform private.ajouter_structure(id_fiche, structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform private.ajouter_pilote(id_fiche, pilote);
            end loop;
    end if;
    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform private.ajouter_referent(id_fiche, referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform private.ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_definition[]
            loop
                perform private.ajouter_indicateur(id_fiche, indicateur);
            end loop;
    end if;

    -- Services
    delete from fiche_action_service_tag where fiche_id = id_fiche;
    if new.services is not null then
        foreach service in array new.services
            loop
                perform private.ajouter_service(id_fiche, service);
            end loop;
    end if;
    -- Financeurs
    delete from fiche_action_financeur_tag where fiche_id = id_fiche;
    if new.financeurs is not null then
        foreach financeur in array new.financeurs::financeur_montant[]
            loop
                perform private.ajouter_financeur(id_fiche, financeur);
            end loop;
    end if;

    -- Fiches liees
    delete from fiche_action_lien where fiche_une = id_fiche or fiche_deux = id_fiche;
    if new.fiches_liees is not null then
        foreach fiche_liee in array new.fiches_liees::private.fiche_resume[]
            loop
                insert into fiche_action_lien (fiche_une, fiche_deux)
                values (id_fiche, fiche_liee.id);
            end loop;
    end if;

    return new;
end;
$$;

-- upsert on public.fiches_action;
create trigger upsert
    instead of insert or update
    on public.fiches_action
    for each row
execute procedure upsert_fiche_action();

-- public.plan_action_export;
create function public.plan_action_export(id integer) returns SETOF fiche_action_export
    language sql
BEGIN ATOMIC
WITH RECURSIVE parents AS (
                          SELECT axe.id,
                                 axe.nom,
                                 axe.collectivite_id,
                                 0 AS depth,
                                 ARRAY[]::text[] AS path,
                                 ('0 '::text || axe.nom) AS sort_path
                          FROM axe
                          WHERE ((axe.parent IS NULL) AND (axe.id = plan_action_export.id) AND can_read_acces_restreint(axe.collectivite_id))
                          UNION ALL
                          SELECT a.id,
                                 a.nom,
                                 a.collectivite_id,
                                 (p_1.depth + 1),
                                 (p_1.path || p_1.nom),
                                 ((((p_1.sort_path || ' '::text) || (p_1.depth + 1)) || ' '::text) || a.nom)
                          FROM (parents p_1
                              JOIN axe a ON ((a.parent = p_1.id)))
                          ), fiches AS (
                          SELECT a.id AS axe_id,
                                 f_1.*::fiches_action AS fiche,
                                 f_1.titre
                          FROM ((parents a
                              JOIN fiche_action_axe faa ON ((a.id = faa.axe_id)))
                              JOIN fiches_action f_1 ON (((f_1.collectivite_id = a.collectivite_id) AND (faa.fiche_id = f_1.id))))
                          )
SELECT p.id,
       p.nom,
       p.path,
       to_jsonb(f.*) AS to_jsonb
FROM (parents p
    LEFT JOIN fiches f ON ((p.id = f.axe_id)))
ORDER BY (naturalsort((p.sort_path || (COALESCE(f.titre, ''::character varying))::text)));
END;


-- public.fiche_resume(fiche_action_indicateur);
create function public.fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint,
       fr.amelioration_continue
FROM private.fiche_resume fr
WHERE fr.id = fiche_resume.fiche_action_indicateur.fiche_id
  AND can_read_acces_restreint(fr.collectivite_id);
END;

-- public.delete_fiche_action;
create function public.delete_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
begin
    delete from fiche_action_thematique where fiche_id = old.id;
    delete from fiche_action_sous_thematique where fiche_id = old.id;
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    alter table fiche_action_pilote disable trigger save_history;
    delete from fiche_action_pilote where fiche_id = old.id;
    alter table fiche_action_pilote enable trigger save_history;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
    delete from fiche_action_financeur_tag where fiche_id = old.id;
    delete from fiche_action_service_tag where fiche_id = old.id;
    delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
    return old;
end;
$$;


-- delete on public.fiche_action;
create trigger delete
    before delete
    on fiche_action
    for each row
execute procedure delete_fiche_action();

-- public.create_fiche;
create function public.create_fiche(
    collectivite_id integer,
    axe_id integer DEFAULT NULL::integer,
    action_id action_id DEFAULT NULL::character varying,
    indicateur_id integer DEFAULT NULL::integer
) returns fiche_resume
    security definer
    language plpgsql
as
$$
declare
    new_fiche_id int;
    resume       fiche_resume;
begin
    if not have_edition_acces(create_fiche.collectivite_id) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    insert into fiche_action (collectivite_id, titre)
    values (create_fiche.collectivite_id, '')
    returning id into new_fiche_id;

    if create_fiche.axe_id is not null
    then
        insert into fiche_action_axe (fiche_id, axe_id)
        values (new_fiche_id, create_fiche.axe_id);
    end if;

    if create_fiche.action_id is not null
    then
        insert into fiche_action_action (fiche_id, action_id)
        values (new_fiche_id, create_fiche.action_id);
    end if;

    if create_fiche.indicateur_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_id)
        values (new_fiche_id, create_fiche.indicateur_id);
    end if;

    select * from fiche_resume where id = new_fiche_id limit 1 into resume;
    return resume;
end;
$$;
comment on function public.create_fiche(integer, integer, action_id, integer) is
    'Crée une nouvelle fiche action dans un axe, une action ou un indicateur.';

--  public.indicateurs_gaz_effet_serre;
create function public.indicateurs_gaz_effet_serre(site_labellisation) returns SETOF indicateur_valeur[]
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT COALESCE(
               (
               SELECT array_agg(iri.*) AS array_agg
               FROM indicateur_valeur iri
               JOIN indicateur_definition id on iri.indicateur_id = id.id
               WHERE iri.collectivite_id = ($1).collectivite_id AND
                   iri.metadonnee_id is not null AND
                   id.identifiant_referentiel::text = ANY (
                       ARRAY[
                           'cae_1.g'::character varying,
                           'cae_1.f'::character varying,
                           'cae_1.h'::character varying,
                           'cae_1.j'::character varying,
                           'cae_1.i'::character varying,
                           'cae_1.c'::character varying,
                           'cae_1.e'::character varying,
                           'cae_1.d'::character varying,
                           'cae_1.a'::character varying
                           ]::text[])
               ),
               '{}'::indicateur_valeur[]
       ) AS "coalesce";
END;
comment on function indicateurs_gaz_effet_serre(site_labellisation) is 'Indicateurs gaz à effet de serre.';

-- public.indicateur_summary
create view public.indicateur_summary as
SELECT c.id                      AS collectivite_id,
       ct.nom AS categorie,
       count(def.*) AS nombre,
       count(iv.*) AS rempli
FROM collectivite c
CROSS JOIN categorie_tag ct
LEFT JOIN indicateur_categorie_tag ict on ct.id = ict.categorie_tag_id
LEFT JOIN indicateur_definition def on ict.indicateur_id = def.id
LEFT JOIN (select indicateur_id, collectivite_id
           from indicateur_valeur
           where resultat is not null
           group by indicateur_id, collectivite_id
          ) iv on def.id = iv.indicateur_id and c.id = iv.collectivite_id
WHERE ct.collectivite_id is null
  and ct.nom not in ('resultat', 'impact', 'prioritaire')
  and def.collectivite_id is null
GROUP BY c.id, ct.id
UNION ALL
SELECT perso.collectivite_id,
       'perso'::text AS categorie,
       count(perso.*) AS nombre,
       count(iv.*) AS rempli
FROM indicateur_definition perso
LEFT JOIN (select indicateur_id, collectivite_id
           from indicateur_valeur
           where resultat is not null
           group by indicateur_id, collectivite_id
          ) iv on perso.id = iv.indicateur_id and perso.collectivite_id = iv.collectivite_id
WHERE perso.collectivite_id is not null
GROUP BY perso.collectivite_id;
comment on view indicateur_summary is
    'Permet d''obtenir le nombre de résultats saisis par indicateur pour chaque collectivité.';


-- Crée les éléments concernés
-- public.indicateur_pilote_user(indicateur_pilote)
create or replace function public.indicateur_pilote_user(indicateur_pilote) returns dcp
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT *
FROM dcp
WHERE user_id = ($1).user_id
limit 1;
END;

-- public.indicateur_enfants
create function public.indicateur_enfants(indicateur_definition) returns SETOF indicateur_definition
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT def.*::indicateur_definition AS def
FROM indicateur_definition def
JOIN indicateur_groupe ig on def.id = ig.enfant
WHERE ig.parent = ($1).id AND is_authenticated();
END;
comment on function public.indicateur_enfants(indicateur_definition) is 'Définitions des indicateurs enfants';

-- public.indicateur_parents
create function public.indicateur_parents(indicateur_definition) returns SETOF indicateur_definition
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT def.*::indicateur_definition AS def
FROM indicateur_definition def
JOIN indicateur_groupe ig on def.id = ig.parent
WHERE ig.enfant = ($1).id AND is_authenticated();
END;
comment on function public.indicateur_parents(indicateur_definition) is 'Définitions des indicateurs parents';


-- Trigger json indicateur

create or replace function
    private.upsert_indicateurs_after_json_insert()
    returns trigger
as
$$
declare
    indicateur jsonb;
    id_courant integer;
begin
    for indicateur in select * from jsonb_array_elements(new.indicateurs)
        loop
            insert into indicateur_definition(identifiant_referentiel,
                                              titre,
                                              titre_long,
                                              description,
                                              unite,
                                              participation_score,
                                              sans_valeur_utilisateur,
                                              modified_at)
            values (indicateur ->> 'id',
                    indicateur ->> 'nom',
                    indicateur ->> 'titre_long',
                    indicateur ->> 'description',
                    indicateur ->> 'unite',
                    (indicateur -> 'participation_score')::bool,
                    (indicateur -> 'sans_valeur')::bool,
                    now()
                   )
            on conflict (identifiant_referentiel) do update
                set identifiant_referentiel         = excluded.identifiant_referentiel,
                    titre                 = excluded.titre,
                    titre_long          = excluded.titre_long,
                    description         = excluded.description,
                    unite               = excluded.unite,
                    participation_score = excluded.participation_score,
                    sans_valeur_utilisateur         = excluded.sans_valeur_utilisateur,
                    modified_at         = excluded.modified_at
            returning id into id_courant;

            --- Enlève les tags TeT s'ils existent déjà
            delete
            from indicateur_categorie_tag ict
            where ict.indicateur_id = id_courant
              and ict.categorie_tag_id in (
                                          select id
                                          from categorie_tag
                                          where collectivite_id is null and groupement_id is null);
            --- Met les tags TeT
            -- selection
            if (indicateur -> 'selection')::bool then
                insert into indicateur_categorie_tag (indicateur_id, categorie_tag_id)
                select id_courant, (select id
                                    from categorie_tag
                                    where nom = 'prioritaire'
                                      and collectivite_id is null and groupement_id is null
                                    limit 1);
            end if;
            -- type
            if indicateur -> 'type' != 'null' and (indicateur -> 'type')::text in ('resultat','impact') then
                insert into indicateur_categorie_tag (indicateur_id, categorie_tag_id)
                select id_courant, (select id
                                    from categorie_tag
                                    where nom = (indicateur -> 'type')::text
                                      and collectivite_id is null and groupement_id is null
                                    limit 1);
            end if;
            -- programmes
            if indicateur -> 'programmes' != 'null' then
                insert into indicateur_categorie_tag (indicateur_id, categorie_tag_id)
                select id_courant, (select id
                                    from categorie_tag
                                    where nom = pg::text
                                      and collectivite_id is null and groupement_id is null
                                    limit 1)
                from jsonb_array_elements_text(indicateur -> 'programmes') as pg
                where pg::text in (select nom from categorie_tag where collectivite_id is null);
            end if;

            -- actions
            if indicateur -> 'action_ids' != 'null' then
                --- insert les liens
                insert into indicateur_action (indicateur_id, action_id)
                select id_courant, id::action_id
                from jsonb_array_elements_text(indicateur -> 'action_ids') as id
                on conflict (indicateur_id, action_id) do nothing;
                --- enlève les liens qui n'existent plus
                delete
                from indicateur_action ia
                where ia.indicateur_id = id_courant
                  and ia.action_id not in
                      (select id::action_id from jsonb_array_elements_text(indicateur -> 'action_ids') as id);
            end if;

            -- thematiques
            --- enlève les thématiques déjà existante
            delete
            from indicateur_thematique ia
            where ia.indicateur_id = id_courant;
            if indicateur -> 'thematiques' != 'null' then
                --- insert les nouvelles thématiques
                insert into indicateur_thematique (indicateur_id, thematique_id)
                select id_courant, (select id
                                    from thematique
                                    where md_id = th::old_indicateur_thematique
                                    limit 1)
                from jsonb_array_elements_text(indicateur -> 'thematiques') as th
                where th::old_indicateur_thematique in (
                                                       select distinct md_id
                                                       from thematique
                                                       )
                on conflict (indicateur_id, thematique_id) do nothing;
            end if;

            -- Supprime les liens de parentés qu'on recréera dans une autre itération
            delete
            from indicateur_groupe
            where enfant = id_courant;
        end loop;

    -- parent
    for indicateur in select * from jsonb_array_elements(new.indicateurs)
        loop
            if indicateur -> 'parent' != 'null'
                and (select count(*)>0
                     from indicateur_definition
                     where identifiant_referentiel = (indicateur -> 'parent')::text) then
                insert into indicateur_groupe (parent, enfant)
                values ((select id
                         from indicateur_definition
                         where identifiant_referentiel = (indicateur -> 'parent')::text
                         limit 1),
                        (select id
                         from indicateur_definition
                         where identifiant_referentiel = (indicateur -> 'id')::text
                         limit 1));
            end if;
        end loop;

    return new;
end;
$$ language plpgsql;

comment on function private.upsert_indicateurs_after_json_insert() is 'Mets à jour les définitions des indicateurs ansi que les liens avec les actions.';


create trigger after_indicateurs_json
    after insert
    on indicateurs_json
    for each row
execute procedure private.upsert_indicateurs_after_json_insert();


COMMIT;
