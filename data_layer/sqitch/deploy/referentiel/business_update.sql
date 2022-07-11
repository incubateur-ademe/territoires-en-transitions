-- Deploy tet:referentiel/business_update to pg

BEGIN;

create function business_upsert_indicateurs(
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
        -- upsert definition
        foreach def in array business_upsert_indicateurs.indicateur_definitions
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
                        def.parent)
                on conflict (id)
                    do update set indicateur_group  = def.indicateur_group,
                                  identifiant       = def.identifiant,
                                  valeur_indicateur = def.valeur_indicateur,
                                  nom               = def.nom,
                                  description       = def.description,
                                  unite             = def.unite,
                                  obligation_eci    = def.obligation_eci,
                                  parent            = def.parent;
                -- delete indicateur actions
                delete
                from indicateur_action
                where indicateur_id = def.id;
            end loop;
        foreach i_a in array indicateur_actions
            loop
                insert into indicateur_action
                values (default,
                        i_a.indicateur_id,
                        i_a.action_id);
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end
$$ language plpgsql;
comment on function business_upsert_indicateurs is
    'Upsert indicateurs and update indicateur action relationships.';


create function business_update_actions(
    definitions action_definition[],
    computed_points action_computed_points[]
) returns void as
$$
declare
    def action_definition;
    pts action_computed_points;
begin
    if is_service_role()
    then
        -- update definitions
        foreach def in array business_update_actions.definitions
            loop
                update action_definition
                set referentiel = def.referentiel,
                    identifiant = def.identifiant,
                    nom         = def.nom,
                    description = def.description,
                    contexte    = def.contexte,
                    exemples    = def.exemples,
                    ressources  = def.ressources,
                    perimetre_evaluation = def.perimetre_evaluation,
                    reduction_potentiel = def.reduction_potentiel,
                    preuve      = def.preuve,
                    points      = def.points,
                    pourcentage = def.pourcentage,
                    categorie = def.categorie
                where action_id = def.action_id;
            end loop;
        -- update computed points
        foreach pts in array business_update_actions.computed_points
            loop
                update action_computed_points
                set value = pts.value
                where action_id = pts.action_id;
            end loop;
    else
        perform set_config('response.status', '401', true);
    end if;
end;
$$ language plpgsql;
comment on function business_update_actions is
    'Update existing action definitions and computed points';


create function business_insert_actions(
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


COMMIT;
