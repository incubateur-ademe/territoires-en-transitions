-- Revert tet:collectivite/preferences from pg

BEGIN;

-- Function prevents from dropping preferences column
drop function if exists public.test_create_collectivite(varchar, varchar);

alter table collectivite
  drop column preferences;

create function
    public.test_create_collectivite(
    nom varchar(300),
    type varchar(20) default 'epci'
)
    returns public.collectivite
    security definer
begin
    atomic
    insert into public.collectivite (nom, type)
    values (test_create_collectivite.nom, test_create_collectivite.type)
    returning *;
end;
comment on function test_create_collectivite is
    'Crée une collectivite de test, avec pour identité EPCI avec 0 habitant.';

COMMIT;
