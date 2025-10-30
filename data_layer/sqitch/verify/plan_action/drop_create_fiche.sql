-- Verify tet:plan_action/drop_create_fiche on pg

BEGIN;

do $$
begin
  assert to_regprocedure('public.create_fiche(int4, int4, action_id, int4)') is null,
         'La fonction public.create_fiche(int4, int4, action_id, int4) existe encore';
end $$;

ROLLBACK;
