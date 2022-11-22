-- Copie les tables des statuts et descriptions associées aux actions.
create table test.action_statut
as
select *
from public.action_statut;
comment on table test.action_statut is
    'Copie de la table action_statut.';

create table test.action_commentaire
as
select *
from public.action_commentaire;
comment on table test.action_commentaire is
    'Copie de la table action_commentaire.';

create function
    test_reset_action_statut_and_desc()
    returns void
as
$$
    -- Vide les tables
truncate action_statut;
truncate action_commentaire;

    -- Restaure les copies
insert into public.action_statut
select *
from test.action_statut;

insert into public.action_commentaire
select *
from test.action_commentaire;

$$ language sql security definer;
comment on function test_reset_action_statut_and_desc is
    'Reinitialise les statuts et descriptions des actions du référentiel complétés par les collectivités.';
