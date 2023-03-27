-- Ajoute les fonctionnalités pour tester les plans d'action.
-- Table fiche_action
create table test.fiche_action as
select * from public.fiche_action;
comment on table test.fiche_action is
    'Copie de la table fiche_action.';

-- Table plan_action
create table test.axe as
select * from public.axe;
comment on table test.axe is
    'Copie de la table axe.';

create table test.fiche_action_axe as
select * from public.fiche_action_axe;
comment on table test.fiche_action_axe is
    'Copie de la table fiche_action_axe.';

-- Table thematique
create table test.thematique as
select * from public.thematique;
comment on table test.thematique is
    'Copie de la table thematique';

create table test.fiche_action_thematique as
select * from public.fiche_action_thematique;
comment on table test.fiche_action_thematique is 'Copie de la table fiche_action_thematique';

create table test.sous_thematique as
select * from public.sous_thematique;
comment on table test.sous_thematique is
    'Copie de la table sous_thematique';

create table test.fiche_action_sous_thematique as
select * from public.fiche_action_sous_thematique;
comment on table test.fiche_action_sous_thematique is 'Copie de la table fiche_action_sous_thematique';

-- Partenaires (FicheActionTags)
create table test.partenaire_tag as
select * from public.partenaire_tag;
comment on table test.partenaire_tag is
    'Copie de la table partenaire_tag.';

create table test.fiche_action_partenaire_tag as
select * from public.fiche_action_partenaire_tag;
comment on table test.fiche_action_partenaire_tag is
    'Copie de la table fiche_action_partenaire_tag.';

-- Structure pilote (FicheActionTags)
create table test.structure_tag as
select * from public.structure_tag;
comment on table test.structure_tag is
    'Copie de la table structure_tag.';

create table test.fiche_action_structure_tag as
select * from public.fiche_action_structure_tag;
comment on table test.fiche_action_structure_tag is
    'Copie de la table fiche_action_structure_tag.';

-- Utilisateurs non enregistrés
create table test.personne_tag as
select * from public.personne_tag;
comment on table test.personne_tag is
    'Copie de la table personne_tag.';

-- Personne pilote (lien auth.users + tags)
create table test.fiche_action_pilote as
select * from public.fiche_action_pilote;
comment on table test.fiche_action_pilote is
    'Copie de la table fiche_action_pilote.';

-- Elu.e référent.e (lien auth.users + tags)
create table test.fiche_action_referent as
select * from public.fiche_action_referent;
comment on table test.fiche_action_referent is
    'Copie de la table fiche_action_referent.';

-- Actions liées
create table test.fiche_action_action as
select * from public.fiche_action_action;
comment on table test.fiche_action_action is
    'Copie de la table fiche_action_action.';

-- Indicateurs liées
create table test.fiche_action_indicateur as
select * from public.fiche_action_indicateur;
comment on table test.fiche_action_indicateur is
    'Copie de la table fiche_action_indicateur.';

-- Service
create table test.service_tag as
select * from public.service_tag;
comment on table test.service_tag is
    'Copie de la table service_tag.';

create table test.fiche_action_service_tag as
select * from public.fiche_action_service_tag;
comment on table test.fiche_action_service_tag is
    'Copie de la table fiche_action_service_tag.';

-- Financeur
create table test.financeur_tag as
select * from public.financeur_tag;
comment on table test.financeur_tag is
    'Copie de la table financeur_tag.';

create table test.fiche_action_financeur_tag as
select * from public.fiche_action_financeur_tag;
comment on table test.fiche_action_financeur_tag is
    'Copie de la table fiche_action_financeur_tag.';


create function
    test_reset_plan_action()
    returns void
as
$$
    -- Vide les tables des audits
    truncate annexe cascade;
truncate fiche_action_financeur_tag;
truncate financeur_tag cascade;
truncate fiche_action_service_tag;
truncate service_tag cascade;
truncate fiche_action_indicateur;
truncate fiche_action_action;
truncate fiche_action_referent;
truncate fiche_action_pilote;
truncate personne_tag cascade;
truncate fiche_action_structure_tag;
truncate structure_tag cascade;
truncate fiche_action_partenaire_tag;
truncate partenaire_tag cascade;
truncate fiche_action_axe;
truncate axe cascade;
truncate fiche_action_sous_thematique;
truncate sous_thematique cascade;
truncate fiche_action_thematique;
truncate thematique cascade;
truncate fiche_action cascade;


insert into public.fiche_action
select * from test.fiche_action;

insert into public.thematique
select * from test.thematique;

insert into public.fiche_action_thematique
select * from test.fiche_action_thematique;

insert into public.sous_thematique
select * from test.sous_thematique;

insert into public.fiche_action_sous_thematique
select * from test.fiche_action_sous_thematique;


insert into public.axe
select * from test.axe;

insert into public.fiche_action_axe
select * from test.fiche_action_axe;

insert into public.partenaire_tag
select * from test.partenaire_tag;

insert into public.fiche_action_partenaire_tag
select * from test.fiche_action_partenaire_tag;

insert into public.structure_tag
select * from test.structure_tag;

insert into public.fiche_action_structure_tag
select * from test.fiche_action_structure_tag;

insert into public.personne_tag
select * from test.personne_tag;

insert into public.fiche_action_pilote
select * from test.fiche_action_pilote;

insert into public.fiche_action_referent
select * from test.fiche_action_referent;

insert into public.fiche_action_action
select * from test.fiche_action_action;

insert into public.fiche_action_indicateur
select * from test.fiche_action_indicateur;

insert into public.service_tag
select * from test.service_tag;

insert into public.fiche_action_service_tag
select * from test.fiche_action_service_tag;

insert into public.financeur_tag
select * from test.financeur_tag;

insert into public.fiche_action_financeur_tag
select * from test.fiche_action_financeur_tag;

$$ language sql security definer;
comment on function test_reset_audit is
    'Reinitialise les audits.';