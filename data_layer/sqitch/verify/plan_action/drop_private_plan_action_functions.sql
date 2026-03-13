-- Verify tet:plan_action/drop_private_plan_action_functions on pg

BEGIN;

-- Ensure the private helper functions no longer exist
select 1 where exists (
    select 1
    from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in (
        'ajouter_thematique',
        'ajouter_sous_thematique',
        'ajouter_partenaire',
        'ajouter_structure',
        'ajouter_service',
        'ajouter_pilote',
        'ajouter_referent',
        'ajouter_action',
        'ajouter_financeur'
    )
) is false;

COMMIT;

