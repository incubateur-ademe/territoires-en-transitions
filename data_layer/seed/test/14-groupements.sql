-- Ajoute les fonctionnalités pour tester les groupements.

-- Copie la table des groupements.
create table test.groupement
as
select *
from public.groupement;
comment on table test.groupement is
    'Copie de la table des groupements.';


create or replace function
    test_reset_groupements()
    returns void
as
$$
-- Vide la tables
truncate public.groupement cascade ;

-- Restaure les copies.
insert into public.groupement
select *
from test.groupement;

$$ language sql security definer;
comment on function test_reset_groupements is
    'Reinitialise les groupements.';

