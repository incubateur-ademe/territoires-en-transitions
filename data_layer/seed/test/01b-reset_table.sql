-- Ajoute les fonctionnalités pour copier et restaurer des tables.

create or replace function
    test.create_copy(sch text, tbl text)
    returns void
as
$$
begin
    execute format(
            'create table test.%I as select * from %I.%I;',
            tbl, sch, tbl
        );
end
$$ language plpgsql;
comment on function test.create_copy is 'Crée la copie d''une table dans le schéma test';

create or replace function
    test.reset_from_copy(sch text, tbl text)
    returns void
as
$$
begin
    -- on vide la table
    execute format(
            'truncate %I.%I cascade;',
            sch, tbl
        );
    -- puis on restaure la copie
    execute format(
            'insert into %I.%I select * from test.%I;',
            sch, tbl, tbl
        );

end
$$ language plpgsql security definer;
comment on function test.reset_from_copy is 'Restaure la copie d''une table depuis le schéma test';

