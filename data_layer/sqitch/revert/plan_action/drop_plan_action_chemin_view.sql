-- Revert tet:plan_action/drop_plan_action_chemin_view from pg

BEGIN;

create or replace view plan_action_chemin(plan_id, axe_id, collectivite_id, chemin) as
WITH RECURSIVE chemin_plan_action AS (SELECT axe.id        AS axe_id,
                                             axe.collectivite_id,
                                             axe.nom,
                                             axe.parent,
                                             ARRAY [axe.*] AS chemin
                                      FROM axe
                                      WHERE axe.parent IS NULL
                                      UNION ALL
                                      SELECT a.id AS axe_id,
                                             a.collectivite_id,
                                             a.nom,
                                             a.parent,
                                             p.chemin || a.*
                                      FROM axe a
                                               JOIN chemin_plan_action p ON a.parent = p.axe_id)
SELECT chemin_plan_action.chemin[1].id AS plan_id,
       chemin_plan_action.axe_id,
       chemin_plan_action.collectivite_id,
       chemin_plan_action.chemin
FROM chemin_plan_action
WHERE can_read_acces_restreint(chemin_plan_action.collectivite_id);

COMMIT;
