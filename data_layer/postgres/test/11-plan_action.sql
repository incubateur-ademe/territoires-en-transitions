-- Ajoute les fonctionnalités pour tester les plans d'action.
-- Table fiche_action
create table test.fiche_action as
select * from public.fiche_action;
comment on table test.fiche_action is
    'Copie de la table fiche_action.';

-- Table plan_action
create table test.plan_action as
select * from public.plan_action;
comment on table test.plan_action is
    'Copie de la table plan_action.';

create table test.fiche_action_plan_action as
select * from public.fiche_action_plan_action;
comment on table test.fiche_action_plan_action is
    'Copie de la table fiche_action_plan_action.';

-- Partenaires (FicheActionTags)
create table test.partenaires_tags as
select * from public.partenaires_tags;
comment on table test.partenaires_tags is
    'Copie de la table partenaires_tags.';

create table test.fiche_action_partenaires_tags as
select * from public.fiche_action_partenaires_tags;
comment on table test.fiche_action_partenaires_tags is
    'Copie de la table fiche_action_partenaires_tags.';

-- Structure pilote (FicheActionTags)
create table test.structures_tags as
select * from public.structures_tags;
comment on table test.structures_tags is
    'Copie de la table structures_tags.';

create table test.fiche_action_structures_tags as
select * from public.fiche_action_structures_tags;
comment on table test.fiche_action_structures_tags is
    'Copie de la table fiche_action_structures_tags.';

-- Utilisateurs non enregistrés
create table test.users_tags as
select * from public.users_tags;
comment on table test.users_tags is
    'Copie de la table users_tags.';

-- Personne pilote (lien auth.users + tags)
create table test.fiche_action_pilotes as
select * from public.fiche_action_pilotes;
comment on table test.fiche_action_pilotes is
    'Copie de la table fiche_action_pilotes.';

-- Elu.e référent.e (lien auth.users + tags)
create table test.fiche_action_referents as
select * from public.fiche_action_referents;
comment on table test.fiche_action_referents is
    'Copie de la table fiche_action_referents.';

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

create table test.fiche_action_indicateur_personnalise as
select * from public.fiche_action_indicateur_personnalise;
comment on table test.fiche_action_indicateur_personnalise is
    'Copie de la table fiche_action_indicateur_personnalise.';

-- TODO gérer les liens
/*
-- Documents et liens (voir preuve)
create table test.annexes as
select * from public.annexes;
comment on table test.annexes is
    'Copie de la table annexes.';

create table test.fiche_action_annexes as
select * from public.fiche_action_annexes;
comment on table test.fiche_action_annexes is
    'Copie de la table fiche_action_annexes.';
 */

create function
    test_reset_plan_action()
    returns void
as
$$
    -- Vide les tables des audits
--truncate fiche_action_annexes;
--truncate annexes cascade;
truncate fiche_action_indicateur_personnalise;
truncate fiche_action_indicateur;
truncate fiche_action_action;
truncate fiche_action_referents;
truncate fiche_action_pilotes;
truncate users_tags cascade;
truncate fiche_action_structures_tags;
truncate structures_tags cascade;
truncate fiche_action_partenaires_tags;
truncate partenaires_tags cascade;
truncate fiche_action_plan_action;
truncate plan_action cascade;
truncate fiche_action cascade;


    insert into public.fiche_action
    select * from test.fiche_action;

    insert into public.plan_action
    select * from test.plan_action;

    insert into public.fiche_action_plan_action
    select * from test.fiche_action_plan_action;

    insert into public.partenaires_tags
    select * from test.partenaires_tags;

    insert into public.fiche_action_partenaires_tags
    select * from test.fiche_action_partenaires_tags;

    insert into public.structures_tags
    select * from test.structures_tags;

    insert into public.fiche_action_structures_tags
    select * from test.fiche_action_structures_tags;

    insert into public.users_tags
    select * from test.users_tags;

    insert into public.fiche_action_pilotes
    select * from test.fiche_action_pilotes;

    insert into public.fiche_action_referents
    select * from test.fiche_action_referents;

    insert into public.fiche_action_action
    select * from test.fiche_action_action;

    insert into public.fiche_action_indicateur
    select * from test.fiche_action_indicateur;

    insert into public.fiche_action_indicateur_personnalise
    select * from test.fiche_action_indicateur_personnalise;

    /*
    insert into public.annexes
    select * from test.annexes;

    insert into public.fiche_action_annexes
    select * from test.fiche_action_annexes;
     */

$$ language sql security definer;
comment on function test_reset_audit is
    'Reinitialise les audits.';