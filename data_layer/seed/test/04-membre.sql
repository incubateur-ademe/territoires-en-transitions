-- Ajoute les fonctionnalités pour tester les membres.

-- Copie la table des membres.
create table test.private_collectivite_membre
as
select *
from public.private_collectivite_membre;
comment on table test.private_collectivite_membre is
    'Copie de la table des membres.';

create function
    test_reset_membres()
    returns void
as
$$
-- Vide la table des membres
truncate private_collectivite_membre;

-- Restaure la copie.
insert into public.private_collectivite_membre
select *
from test.private_collectivite_membre;
$$ language sql security definer;
comment on function test_reset_membres is
    'Reinitialise les membres.';

