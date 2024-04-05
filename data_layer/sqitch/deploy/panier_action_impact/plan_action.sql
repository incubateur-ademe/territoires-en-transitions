-- Deploy tet:panier_action_impact/plan_action to pg

BEGIN;

create table fiche_action_effet_attendu
(
    fiche_id         integer references fiche_action,
    effet_attendu_id integer references effet_attendu,
    primary key (fiche_id, effet_attendu_id)
);
comment on table fiche_action_effet_attendu is
    'Lie une fiche action à un effet attendu';

create function
    plan_from_panier(collectivite_id int, panier_id uuid)
    returns plan_action
    stable
    security invoker
as
$$
declare
    axe_id                 integer;
    selected_action_impact action_impact;
    fiche_id               integer;
begin
    if not can_read_acces_restreint($1) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- on commence par créer un plan
    axe_id = upsert_axe('Plan d''action à impact', $1, null);

    -- puis pour chaque action à impact du panier
    for selected_action_impact in
        select ai.*
        from panier p
                 join action_impact_panier ap on ap.panier_id = p.id
                 join action_impact ai on ap.action_id = ai.id
        where p.id = $2
        loop
            -- on insère une fiche
            insert into fiche_action (collectivite_id, description)
            select $1, selected_action_impact.description || '\n' || selected_action_impact.description_complementaire
            returning id into fiche_id;

            -- puis on ajoute la fiche nouvellement créée au plan
            perform ajouter_fiche_action_dans_un_axe(fiche_id, axe_id);

            -- ensuite on applique de l'action à la fiche:
            -- - les thematiques
            insert into fiche_action_thematique (fiche_id, thematique_id)
            select fiche_id, ait.thematique_id
            from action_impact_thematique ait
            where ait.action_impact_id = selected_action_impact.id;

            -- - les sous-thematiques
            insert into fiche_action_sous_thematique (fiche_id, thematique_id)
            select fiche_id, aist.sous_thematique_id
            from action_impact_sous_thematique as aist
            where aist.action_impact_id = selected_action_impact.id;

            -- - les indicateurs
            insert into fiche_action_indicateur (fiche_id, indicateur_id)
            select fiche_id, aii.indicateur_id
            from action_impact_indicateur as aii
            where aii.action_impact_id = selected_action_impact.id;

            -- - les effets attendus
            insert into fiche_action_effet_attendu (fiche_id, effet_attendu_id)
            select fiche_id, aiea.effet_attendu_id
            from action_impact_effet_attendu as aiea
            where aiea.action_impact_id = selected_action_impact.id;
        end loop;
end;
$$ language plpgsql;
comment on function plan_from_panier(int, uuid) is
    'Crée un plan d''action à partir d''un panier pour une collectivité. '
        'Renvoie le plan nouvellement créé.';

COMMIT;
