-- Ajoute les fonctionnalités pour tester les réponses.

-- Copie les tables des réponses.
create table test.reponse_binaire
as
select *
from public.reponse_binaire;
comment on table test.reponse_binaire is
    'Copie de la table reponse_binaire.';

create table test.historique_reponse_binaire
as
select *
from historique.reponse_binaire;
comment on table test.historique_reponse_binaire is
    'Copie de la table historique.reponse_binaire.';

create table test.reponse_choix
as
select *
from public.reponse_choix;
comment on table test.reponse_choix is
    'Copie de la table reponse_choix.';

create table test.historique_reponse_choix
as
select *
from historique.reponse_choix;
comment on table test.historique_reponse_choix is
    'Copie de la table historique.reponse_choix.';

create table test.reponse_proportion
as
select *
from public.reponse_proportion;
comment on table test.reponse_proportion is
    'Copie de la table reponse_proportion.';

create table test.historique_reponse_proportion
as
select *
from historique.reponse_proportion;
comment on table test.historique_reponse_proportion is
    'Copie de la table historique.reponse_proportion.';

create function
    test_reset_reponse()
    returns void
as
$$

    -- Vide les tables des réponses
    truncate justification;
    truncate reponse_binaire;
    truncate historique.reponse_binaire;
    truncate reponse_choix;
    truncate historique.reponse_choix;
    truncate reponse_proportion;
    truncate historique.reponse_proportion;
    truncate personnalisation_consequence;

    -- Restaure les copies
    insert into public.reponse_binaire
    select *
    from test.reponse_binaire;

    insert into historique.reponse_binaire
    select *
    from test.historique_reponse_binaire;

    insert into public.reponse_choix
    select *
    from test.reponse_choix;

    insert into historique.reponse_choix
    select *
    from test.historique_reponse_choix;

    insert into public.reponse_proportion
    select *
    from test.reponse_proportion;

    insert into historique.reponse_proportion
    select *
    from test.historique_reponse_proportion;
$$ language sql security definer;

comment on function test_reset_reponse is
    'Reinitialise les réponses de personnalisation des référentiels.';
