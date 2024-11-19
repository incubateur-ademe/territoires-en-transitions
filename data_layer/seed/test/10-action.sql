-- Copie les tables des statuts et descriptions associées aux actions.
create table test.action_statut
as
select *
from public.action_statut;
comment on table test.action_statut is
    'Copie de la table action_statut.';

create table test.historique_action_statut
as
select *
from historique.action_statut;
comment on table test.historique_action_statut is
    'Copie de la table historique.action_statut.';

create table test.action_commentaire
as
select *
from public.action_commentaire;
comment on table test.action_commentaire is
    'Copie de la table action_commentaire.';

create table test.historique_action_commentaire
as
select *
from historique.action_precision;
comment on table test.historique_action_commentaire is
    'Copie de la table historique.action_precision.';

create or replace function
    test_reset_action_statut_and_desc()
    returns void
as
$$
-- désactive temporairement les triggers pour accélérer les inserts
    alter table action_statut
        disable trigger action_statut_check_insert;
    alter table action_statut
        disable trigger action_statut_check_update;
    alter table action_statut
        disable trigger after_action_statut_insert;
    alter table action_statut
        disable trigger save_history;
    alter table action_commentaire
        disable trigger save_history;
    alter table action_commentaire
        disable trigger set_modified_at_before_action_commentaire_update;

    -- Vide les tables
    truncate action_statut;
    truncate historique.action_statut;
    truncate action_commentaire;
    truncate historique.action_precision;
    truncate justification_ajustement;

    -- Restaure les copies
    insert into public.action_statut
    select *
    from test.action_statut;

    insert into historique.action_statut
    select *
    from test.historique_action_statut;

    insert into public.action_commentaire
    select *
    from test.action_commentaire;

    insert into historique.action_precision
    select *
    from test.historique_action_commentaire;

-- ré active les triggers
    alter table action_statut
        enable trigger action_statut_check_insert;
    alter table action_statut
        enable trigger action_statut_check_update;
    alter table action_statut
        enable trigger after_action_statut_insert;
    alter table action_statut
        enable trigger save_history;
    alter table action_commentaire
        enable trigger save_history;
    alter table action_commentaire
        enable trigger set_modified_at_before_action_commentaire_update;
$$
    language sql
    security definer;
comment on function test_reset_action_statut_and_desc is
    'Reinitialise les statuts et descriptions des actions du référentiel complétés par les collectivités.';
