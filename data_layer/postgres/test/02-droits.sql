-- Ajoute les fonctionnalités pour tester les droits.

-- Copie la table des droits.
create table test.private_utilisateur_droit
as
select *
from public.private_utilisateur_droit;
comment on table test.private_utilisateur_droit is
    'Copie de la table des droits.';

create function
    test_reset_droits()
    returns void
as
$$
-- Vide la table des droits
truncate private_utilisateur_droit;

-- Restaure la copie.
insert into public.private_utilisateur_droit
select *
from test.private_utilisateur_droit;
$$ language sql security definer;
comment on function test_reset_droits is
    'Reinitialise les droits.';

