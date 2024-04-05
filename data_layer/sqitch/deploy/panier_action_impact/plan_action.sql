-- Deploy tet:panier_action_impact/plan_action to pg

BEGIN;

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
            -- on insert une fiche
            insert into fiche_action (collectivite_id, description)
            select $1, selected_action_impact.description || '\n' || selected_action_impact.description_complementaire
            returning id into fiche_id;

            -- on ajoute la fiche nouvellement cau plan
            perform ajouter_fiche_action_dans_un_axe(fiche_id, axe_id);

            -- todo
            -- - thématiques → thématiques
            -- - sous-thématiques → sous-thématiques
            -- - elements budgétaires → champ “financements”
            -- - effets_attendus → résultats attendus (qui va être renommé - ticket prévu)
            -- - partenaires potentiels → partenaires
            -- - Indicateurs macro parents → indicateurs liés
            -- - Indicateurs macro enfants → indicateurs liés
        end loop;
end;
$$ language plpgsql;
comment on function plan_from_panier(int, uuid) is
    'Crée un plan d''action à partir d''un panier pour une collectivité. '
        'Renvoie le plan nouvellement créé.';

COMMIT;
