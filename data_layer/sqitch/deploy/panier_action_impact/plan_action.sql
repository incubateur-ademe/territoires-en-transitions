-- Deploy tet:panier_action_impact/plan_action to pg

BEGIN;

-- Ajoute le lien plan-panier
alter table axe add column panier_id uuid references panier;
comment on column axe.panier_id is 'Lien vers le dernier panier à actions qui a créé/modifié le plan';

drop function plan_from_panier;

-- Complète la fonction
create or replace function
    plan_from_panier(
    collectivite_id int,
    panier_id uuid,
    plan_id int default null::integer)
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

    if plan_from_panier.plan_id is null then
        -- on commence par créer un plan
        new_plan_id = upsert_axe('Plan d''action à impact', $1, null);
    else
        new_plan_id = plan_from_panier.plan_id;
    end if;
    -- fait le lien entre le plan et le panier
    update axe set panier_id = plan_from_panier.panier_id where id = new_plan_id;

    -- puis pour chaque action à impact du panier
    for selected_action_impact in
        select ai.*
        from panier p
        join action_impact_panier ap on ap.panier_id = p.id
        join action_impact ai on ap.action_id = ai.id
        where p.id = $2
        loop
            -- on insère une fiche
            insert into fiche_action (collectivite_id, titre, description, financements, statut)
            select $1,
                   selected_action_impact.titre,
                   selected_action_impact.description || '\n' || selected_action_impact.description_complementaire,
                   (select aifb.nom
                    from action_impact_fourchette_budgetaire aifb
                    join action_impact ai on aifb.niveau = ai.fourchette_budgetaire
                    where ai.id = selected_action_impact.id
                    limit 1),
                   (select
                        case
                            when ais.categorie_id is null
                                     or ais.categorie_id not in ('en_cours', 'realise') then
                                'À venir'::fiche_action_statuts
                            else
                                aic.nom::fiche_action_statuts
                        end as statut
                    from action_impact ai
                    left join action_impact_statut ais
                              on ai.id = ais.action_id and ais.panier_id = plan_from_panier.panier_id
                    left join action_impact_categorie aic on ais.categorie_id = aic.id
                    where ai.id = selected_action_impact.id
                    limit 1)
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

            -- - les actions
            insert into fiche_action_action (fiche_id, action_id)
            select new_fiche_id, aia.action_id
            from action_impact_action aia
            where aia.action_impact_id = selected_action_impact.id;

            -- - les partenaires
            perform private.ajouter_partenaire(
                    new_fiche_id,
                    (
                    select pt.*::partenaire_tag
                    from (
                         select null as id,
                                pp.nom as nom,
                                plan_from_panier.collectivite_id as collectivite_id
                         )
                        pt limit 1
                    )
                    )
            from action_impact_partenaire aip
            join panier_partenaire pp on aip.partenaire_id = pp.id
            where aip.action_impact_id = selected_action_impact.id;

            -- - les liens
            insert into annexe (collectivite_id, fichier_id, url, fiche_id, titre)
            select plan_from_panier.collectivite_id, null, lien.url,new_fiche_id,  lien.label
            from (
                 select
                     jsonb_array_elements(rex)->>'url' AS url,
                     jsonb_array_elements(rex)->>'label' AS label
                 from action_impact
                 where id = selected_action_impact.id
                 union
                 select
                     jsonb_array_elements(ressources_externes)->>'url' AS url,
                     jsonb_array_elements(ressources_externes)->>'label' AS label
                 from action_impact
                 where id = selected_action_impact.id) lien;

        end loop;

    perform set_config('response.status', '201', true);
    return new_plan_id;
end;
$$ language plpgsql;

COMMIT;
