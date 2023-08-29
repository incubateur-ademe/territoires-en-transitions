-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;


create or replace function
    have_admin_acces(id integer)
    returns boolean
as
$$
select have_one_of_niveaux_acces('{admin}', have_admin_acces.id)
$$ language sql;


create or replace function
    have_edition_acces(id integer)
    returns boolean
as
$$
select have_one_of_niveaux_acces('{admin, edition}', have_edition_acces.id)
$$ language sql;

create or replace function
    have_lecture_acces(id integer)
    returns boolean
as
$$
select have_one_of_niveaux_acces('{admin, edition, lecture}', have_lecture_acces.id)
$$ language sql;

COMMIT;
