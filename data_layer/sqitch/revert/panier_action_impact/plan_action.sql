-- Deploy tet:panier_action_impact/plan_action to pg

BEGIN;

drop function plan_from_panier;

create or replace function
    plan_from_panier(collectivite_id int, panier_id uuid)
    returns integer
    volatile
    security definer
as
$$
declare
    selected_action_impact action_impact;
    new_plan_id  integer;
    new_fiche_id integer;
begin
    if not can_read_acces_restreint($1) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- on commence par créer un plan
    new_plan_id = upsert_axe('Plan d''action à impact', $1, null);

    -- puis pour chaque action à impact du panier
    for selected_action_impact in
        select ai.*
        from panier p
                 join action_impact_panier ap on ap.panier_id = p.id
                 join action_impact ai on ap.action_id = ai.id
        where p.id = $2
        loop
            -- on insère une fiche
            insert into fiche_action (collectivite_id, titre, description)
            select $1, selected_action_impact.titre, selected_action_impact.description || '\n' || selected_action_impact.description_complementaire
            returning id into new_fiche_id;

            -- - on enregistre le lien entre la fiche et l'action à impact
            insert into action_impact_fiche_action (fiche_id, action_impact_id)
            values (new_fiche_id, selected_action_impact.id);

            -- puis on ajoute la fiche nouvellement créée au plan
            perform ajouter_fiche_action_dans_un_axe(new_fiche_id, new_plan_id);

            -- ensuite on applique de l'action à la fiche:
            -- - les thematiques
            insert into fiche_action_thematique (fiche_id, thematique_id)
            select new_fiche_id, ait.thematique_id
            from action_impact_thematique ait
            where ait.action_impact_id = selected_action_impact.id;

            -- - les sous-thematiques
            insert into fiche_action_sous_thematique (fiche_id, thematique_id)
            select new_fiche_id, aist.sous_thematique_id
            from action_impact_sous_thematique as aist
            where aist.action_impact_id = selected_action_impact.id;

            -- - les indicateurs
            insert into fiche_action_indicateur (fiche_id, indicateur_id)
            select new_fiche_id, aii.indicateur_id
            from action_impact_indicateur as aii
            where aii.action_impact_id = selected_action_impact.id;

            -- - les effets attendus
            insert into fiche_action_effet_attendu (fiche_id, effet_attendu_id)
            select new_fiche_id, aiea.effet_attendu_id
            from action_impact_effet_attendu as aiea
            where aiea.action_impact_id = selected_action_impact.id;
        end loop;

    perform set_config('response.status', '201', true);
    return new_plan_id;
end;
$$ language plpgsql;

-- Enlève le lien plan-panier
alter table axe drop column panier_id;

COMMIT;
