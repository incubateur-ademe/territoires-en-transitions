-- Revert tet:collectivite/typologie_sinoe from pg

BEGIN;

-- La fonction de test (seed) dépend de toutes les colonnes de collectivite
-- via son `returning *` : on la retire le temps du drop, puis on la recrée
-- si elle existait.
create temporary table _had_test_create_collectivite on commit drop as
select to_regprocedure('public.test_create_collectivite(varchar, varchar)') is not null as present;

drop function if exists public.test_create_collectivite(varchar, varchar);

alter table collectivite
    drop column if exists sinoe_id;

drop table if exists typologie_sinoe;

do
$$
    begin
        if (select present from _had_test_create_collectivite) then
            execute $fn$
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
            $fn$;
            comment on function public.test_create_collectivite is
                'Crée une collectivite de test, avec pour identité EPCI avec 0 habitant.';
        end if;
    end
$$;

COMMIT;
