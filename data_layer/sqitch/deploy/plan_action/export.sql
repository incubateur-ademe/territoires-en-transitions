-- Deploy tet:plan_action/export to pg

BEGIN;

drop function plan_action_export;

create type fiche_action_export as
(
    axe_id   integer,
    axe_nom  text,
    axe_path text[],
    fiche    jsonb
);
comment on type fiche_action_export is
    'Les informations pour lister une fiche dans l''export Excel des plans d''action.';

create function
    plan_action_export(id integer)
    returns setof fiche_action_export
begin
    atomic
    with recursive
        parents as (select axe.id,
                           axe.nom,
                           axe.collectivite_id,
                           0                as depth,
                           array []::text[] as path,
                           '0 ' || nom      as sort_path
                    from axe
                    where parent is null
                      and axe.id = plan_action_export.id
                      and can_read_acces_restreint(axe.collectivite_id)

                    union all

                    select a.id,
                           a.nom,
                           a.collectivite_id,
                           depth + 1,
                           path || p.nom,
                           p.sort_path || ' ' || depth + 1 || ' ' || a.nom
                    from parents p
                             join axe a on a.parent = p.id),
        fiches as (select a.id as axe_id,
                          f    as fiche
                   from parents a
                            join fiche_action_axe faa on a.id = faa.axe_id
                            join fiches_action f on faa.fiche_id = f.id)
    select p.id, p.nom, p.path, to_jsonb(f)
    from parents p
             left join fiches f on p.id = f.axe_id
    order by naturalsort(sort_path);
end;
comment on function plan_action_export is
    'Les fiches ordonnancées pour l''export des plans d''action.';


COMMIT;
