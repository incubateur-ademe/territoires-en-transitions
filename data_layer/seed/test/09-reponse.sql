-- Ajoute les fonctionnalités pour tester les réponses.

-- Copie les tables des réponses.
create table test.reponse_binaire
as
select *
from public.reponse_binaire;
comment on table test.reponse_binaire is
    'Copie de la table reponse_binaire.';

create table test.reponse_choix
as
select *
from public.reponse_choix;
comment on table test.reponse_choix is
    'Copie de la table reponse_choix.';

create table test.reponse_proportion
as
select *
from public.reponse_proportion;
comment on table test.reponse_proportion is
    'Copie de la table reponse_proportion.';

create function
    test_reset_reponse()
    returns void
as
$$

-- désactive temporairement les triggers pour accélérer les inserts
    alter table reponse_binaire
        disable trigger after_reponse_insert;
    alter table reponse_binaire
        disable trigger save_history;
    alter table reponse_binaire
        disable trigger set_modified_at_before_reponse_binaire_update;
    alter table reponse_choix
        disable trigger after_reponse_insert;
    alter table reponse_choix
        disable trigger save_history;
    alter table reponse_choix
        disable trigger set_modified_at_before_reponse_choix_update;
    alter table reponse_proportion
        disable trigger after_reponse_insert;
    alter table reponse_proportion
        disable trigger save_history;
    alter table reponse_proportion
        disable trigger set_modified_at_before_reponse_proportion_update;

    -- Vide les tables des réponses
    truncate justification;
    truncate reponse_binaire;
    truncate reponse_choix;
    truncate reponse_proportion;
    truncate personnalisation_consequence;

    -- Restaure les copies
    insert into public.reponse_binaire
    select *
    from test.reponse_binaire;

    insert into public.reponse_choix
    select *
    from test.reponse_choix;

    insert into public.reponse_proportion
    select *
    from test.reponse_proportion;

-- ré active les triggers
    alter table reponse_binaire
        enable trigger after_reponse_insert;
    alter table reponse_binaire
        enable trigger save_history;
    alter table reponse_binaire
        enable trigger set_modified_at_before_reponse_binaire_update;
    alter table reponse_choix
        enable trigger after_reponse_insert;
    alter table reponse_choix
        enable trigger save_history;
    alter table reponse_choix
        enable trigger set_modified_at_before_reponse_choix_update;
    alter table reponse_proportion
        enable trigger after_reponse_insert;
    alter table reponse_proportion
        enable trigger save_history;
    alter table reponse_proportion
        enable trigger set_modified_at_before_reponse_proportion_update;
    $$ language sql security definer;
comment on function test_reset_reponse is
    'Reinitialise les réponses de personnalisation des référentiels.';
