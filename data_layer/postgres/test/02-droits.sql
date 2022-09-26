-- Ajoute les fonctionnalités pour tester les droits.

-- Copie la table des droits.
create table test.private_utilisateur_droit
as
select *
from public.private_utilisateur_droit;
comment on table test.private_utilisateur_droit is
    'Copie de la table des droits.';


-- Copie la table des invitations.
create table test.invitation
as
select *
from utilisateur.invitation i;
comment on table test.invitation is
    'Copie de la table des invitations.';


create or replace function
    test_reset_droits()
    returns void
as
$$
-- Vide la tables
truncate utilisateur.invitation cascade ;
truncate private_utilisateur_droit cascade ;

-- Restaure les copies.
insert into public.private_utilisateur_droit
select *
from test.private_utilisateur_droit;

insert into utilisateur.invitation (niveau, email, collectivite_id, created_by, accepted_at)
select niveau, email, collectivite_id, created_by, accepted_at
from test.invitation;
$$ language sql security definer;
comment on function test_reset_droits is
    'Reinitialise les droits.';

