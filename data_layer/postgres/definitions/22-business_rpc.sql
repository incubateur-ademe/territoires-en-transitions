drop function upsert_indicateur_definitions;

create or replace function upsert_indicateur_definitions(
    definitions indicateur_definition[]
) returns void as
$$
declare
    def indicateur_definition;
begin
    if is_service_role()
    then
        foreach def in array definitions
            loop
                insert into indicateur_definition
                values (default,
                        def.id,
                        def.indicateur_group,
                        def.identifiant,
                        def.valeur_indicateur,
                        def.nom,
                        def.description,
                        def.unite,
                        def.obligation_eci,
                        def.parent);
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;
