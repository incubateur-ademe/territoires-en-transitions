create or replace function upsert_indicateurs(
    indicateur_definitions indicateur_definition[],
    indicateur_actions indicateur_action[]
) returns void as
$$
declare
    def indicateur_definition;
    i_a indicateur_action;
begin
    if is_service_role()
    then
        foreach def in array indicateur_definitions
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
        foreach i_a in array indicateur_actions
            loop
                insert into indicateur_action
                values (i_a.indicateur_id,
                        i_a.action_id);
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;
