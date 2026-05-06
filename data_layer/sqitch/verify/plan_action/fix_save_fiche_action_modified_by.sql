-- Verify tet:plan_action/fix_save_fiche_action_modified_by on pg

BEGIN;

select has_function_privilege('historique.save_fiche_action()', 'execute');

-- La branche INSERT doit utiliser `new.modified_by` et plus `auth.uid()`.
-- On vérifie qu'aucun `auth.uid()` ne subsiste dans le corps de la fonction.
do $$
begin
    if exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'historique'
          and p.proname = 'save_fiche_action'
          and pg_get_functiondef(p.oid) like '%auth.uid()%'
    ) then
        raise exception 'historique.save_fiche_action() contient encore auth.uid() — le fix n''a pas été appliqué';
    end if;
end$$;

ROLLBACK;
