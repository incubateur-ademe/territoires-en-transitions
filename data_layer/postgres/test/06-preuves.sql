-- Ajoute les fonctionnalités pour tester les preuves.

-- Copie les tables des preuves.
do
$$
    declare
        columns text;
        name    text;
    begin
        -- Pour chaque type, et donc chaque table nommée preuve_[type]
        foreach name in array enum_range(NULL::preuve_type)

            loop
            -- on copie la table public.preuve_[type] dans test.preuve_[type]
            --- la liste des colonnes sans 'lien' qui est une colonne générée
                select array_to_string(array_agg(format('%I', column_name)), ', ')
                from information_schema.columns
                where table_name = format('preuve_%I', name)
                  and table_schema = 'public'
                  and column_name not in ('lien')
                into columns;

                raise notice '%', columns;

                execute format(
                                'create table test.preuve_%I as select ' || columns || ' from public.preuve_%I;',
                                name, name
                    );
            end loop;
    end
$$;

create or replace function
    test_reset_preuves()
    returns void
as
$$
declare
    name    text;
    columns text;
begin
    -- Pour chaque type, et donc chaque table nommée preuve_[type]
    foreach name in array enum_range(NULL::preuve_type)
        loop
            -- on vide la table public.preuve_[type]
            execute format(
                    'truncate public.preuve_%I;',
                    name, name
                );
            --- la liste des colonnes sans 'lien' qui est une colonne générée
            select array_to_string(array_agg(format('%I', column_name)), ', ')
            from information_schema.columns
            where table_name = format('preuve_%I', name)
              and table_schema = 'public'
              and column_name not in ('lien')
            into columns;

            -- puis on restaure la copie
            execute format(
                            'insert into public.preuve_%I(' || columns || ') select * from test.preuve_%I;',
                            name, name
                );
        end loop;
end
$$ language plpgsql security definer;
comment on function test_reset_preuves is
    'Reinitialise les preuves de toutes les collectivités.';
