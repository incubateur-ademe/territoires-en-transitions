-- Deploy tet:plan_action/fiches to pg

BEGIN;

create type fiche_action_echeances as enum(
    'Action en amélioration continue',
    'Sans échéance',
    'Échéance dépassée',
    'Échéance dans moins de trois mois',
    'Échéance entre trois mois et 1 an',
    'Échéance dans plus d’un an'
    );


drop function filter_fiches_action;
create function
    filter_fiches_action(
    collectivite_id integer,
    sans_plan boolean default false,
    axes_id integer[] default null,
    sans_pilote boolean default false,
    pilotes personne[] default null,
    sans_referent boolean default false,
    referents personne[] default null,
    sans_niveau boolean default false,
    niveaux_priorite fiche_action_niveaux_priorite[] default null,
    sans_statut boolean default false,
    statuts fiche_action_statuts[] default null,
    sans_thematique boolean default false,
    thematiques thematique[] default null,
    sans_sous_thematique boolean default false,
    sous_thematiques sous_thematique[] default null,
    sans_budget boolean default false,
    budget_min integer default null,
    budget_max integer default null,
    sans_date boolean default false,
    date_debut timestamptz default null,
    date_fin timestamptz default null,
    echeance fiche_action_echeances default null,
    "limit" integer default 10
)
    returns setof fiche_resume
as
$$
    # variable_conflict use_variable
begin
    if not can_read_acces_restreint(filter_fiches_action.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        select fr.*
        from fiche_resume fr
                 join fiche_action fa on fr.id = fa.id
        where fr.collectivite_id = filter_fiches_action.collectivite_id
          and case -- axes_id
                  when sans_plan then
                          fr.id not in (select distinct fiche_id from fiche_action_axe)
                  when axes_id is null then true
                  else fr.id in (with child as (select a.axe_id as axe_id
                                                from axe_descendants a
                                                where a.parents && (axes_id)
                                                   or a.axe_id in (select * from unnest(axes_id)))
                                 select fiche_id
                                 from child
                                          join fiche_action_axe using (axe_id))
            end
          and case -- pilotes
                  when sans_pilote then
                          fr.id not in (select distinct fiche_id from fiche_action_pilote)
                  when pilotes is null then true
                  else fr.id in
                       (select fap.fiche_id
                        from fiche_action_pilote fap
                        where fap.tag_id in (select (pi::personne).tag_id from unnest(pilotes) pi)
                           or fap.user_id in (select (pi::personne).user_id from unnest(pilotes) pi))
            end
          and case -- referents
                  when sans_referent then
                          fr.id not in (select distinct fiche_id from fiche_action_referent)
                  when referents is null then true
                  else fr.id in
                       (select far.fiche_id
                        from fiche_action_referent far
                        where far.tag_id in (select (re::personne).tag_id from unnest(referents) re)
                           or far.user_id in (select (re::personne).user_id from unnest(referents) re))
            end
          and case -- niveaux_priorite
                  when sans_niveau then fa.niveau_priorite is null
                  when niveaux_priorite is null then true
                  else fa.niveau_priorite in (select * from unnest(niveaux_priorite::fiche_action_niveaux_priorite[]))
            end
          and case -- statuts
                  when sans_statut then fa.statut is null
                  when statuts is null then true
                  else fr.statut in (select * from unnest(statuts::fiche_action_statuts[]))
            end
          and case -- thematiques
                  when sans_thematique then
                          fr.id not in (select distinct fiche_id from fiche_action_thematique)
                  when thematiques is null then true
                  else fr.id in
                       (select fat.fiche_id
                        from fiche_action_thematique fat
                        where fat.thematique in (select * from unnest(thematiques::thematique[]) th))
            end
          and case -- sous_thematiques
                  when sans_sous_thematique then
                          fr.id not in (select distinct fiche_id from fiche_action_sous_thematique)
                  when sous_thematiques is null then true
                  else fr.id in
                       (select fast.fiche_id
                        from fiche_action_sous_thematique fast
                        where fast.thematique_id in (select (sth::sous_thematique).id
                                                     from unnest(sous_thematiques::sous_thematique[]) sth))
            end
          and case -- budget_min
                  when sans_budget then fa.budget_previsionnel is null
                  when budget_min is null then true
                  when fa.budget_previsionnel is null then false
                  else fa.budget_previsionnel>=budget_min
            end
          and case -- budget_max
                  when sans_budget then fa.budget_previsionnel is null
                  when budget_max is null then true
                  when fa.budget_previsionnel is null then false
                  else fa.budget_previsionnel<=budget_max
            end
          and case -- date_debut
                  when sans_date then fa.date_debut is null
                  when filter_fiches_action.date_debut is null then true
                  when fa.date_debut is null then false
                  else fa.date_debut<=filter_fiches_action.date_debut
            end
          and case -- date_fin
                  when sans_date then fa.date_fin_provisoire is null
                  when date_fin is null then true
                  when fa.date_fin_provisoire is null then false
                  else fa.date_fin_provisoire<=date_fin
            end
          and case -- echeances
                  when echeance is null then true
                  when echeance = 'Action en amélioration continue'
                      then fa.amelioration_continue
                  when echeance = 'Sans échéance'
                      then fa.date_fin_provisoire is null
                  when echeance = 'Échéance dépassée'
                      then fa.date_fin_provisoire>now()
                  when echeance = 'Échéance dans moins de trois mois'
                      then fa.date_fin_provisoire < (now() + interval '3 months')
                  when echeance = 'Échéance entre trois mois et 1 an'
                      then fa.date_fin_provisoire >= (now() + interval '3 months')
                      and fa.date_fin_provisoire < (now() + interval '1 year')
                  when echeance = 'Échéance dans plus d’un an'
                      then fa.date_fin_provisoire > (now() + interval '1 year')
                  else false
            end
        order by naturalsort(fr.titre)
        limit filter_fiches_action."limit";
end;
$$ language plpgsql security definer
                    stable;

COMMIT;
