create or replace function business_insert_actions(
    relations action_relation[],
    definitions action_definition[],
    computed_points action_computed_points[]
) returns void as
$$
declare
    rel action_relation;
    def action_definition;
    pts action_computed_points;
begin
    if is_service_role()
    then
        -- insert relations
        foreach rel in array business_insert_actions.relations
            loop
                insert into action_relation(id, referentiel, parent)
                values(rel.id, rel.referentiel, rel.parent);
            end loop;
        -- insert definitions
        foreach def in array business_insert_actions.definitions
            loop
                insert into action_definition(action_id, referentiel, identifiant, nom, description, contexte, exemples, ressources,  perimetre_evaluation, reduction_potentiel,
                                              preuve, points, pourcentage, categorie)
                values(def.action_id, def.referentiel, def.identifiant, def.nom, def.description, def.contexte, def.exemples, def.ressources, def. perimetre_evaluation, def.reduction_potentiel,
                       def.preuve, def.points, def.pourcentage, def.categorie);
            end loop;
        -- insert computed points
        foreach pts in array business_insert_actions.computed_points
            loop
                insert into action_computed_points(action_id, value) values(pts.action_id, pts.value);
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end;
$$ language plpgsql;
comment on function business_insert_actions is
    'Insert les definitions des actions, les enfants et les points calculés par le business';
