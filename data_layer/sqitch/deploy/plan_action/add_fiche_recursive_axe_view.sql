-- Deploy tet:plan_action/add_fiche_recursive_axe_view to pg

BEGIN;

-- Drizzle is not dealing with recursive, so it's simpler to create a view
CREATE or replace view public.fiche_recursive_axe AS
with recursive cte as (
      select faa.fiche_id, a.id, a.nom, a.parent as parent_id, a.plan as plan_id, a.collectivite_id,
      1 as axe_level
      from fiche_action_axe faa 
      left join axe a 
      on faa.axe_id  = a.id
      union all
      select cte.fiche_id, s.id, s.nom, s.parent as parent_id, s.plan as plan_id, s.collectivite_id,
      cte.axe_level + 1 as axe_level
      from cte join
           axe s
           on s.id = cte.parent_id
     )
select * from cte;


COMMIT;
