-- Deploy tet:plan_action/type to pg

BEGIN;

create function
    plan_action_type(axe)
    returns setof plan_action_type
    language sql
    security definer
    rows 1
begin
    atomic
    select case
               when $1.type is null then null
               else (select t
                     from plan_action_type t
                     where id = $1.type)
               end;
end;
comment on function plan_action_type is
    'Le type du plan d''action, quand l''axe est un plan. Peut-être null.';


COMMIT;
