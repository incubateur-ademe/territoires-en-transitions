-- Revert tet:demarche/plan_actions_multiples from pg

BEGIN;

ALTER TABLE public.demarche
    ADD COLUMN plan_action_id integer NULL REFERENCES public.axe(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.demarche.plan_action_id IS
    'Plan d''action (axe racine) rattaché à la démarche pour le programme d''actions.';

-- La colonne n'en tient qu'un : le rattachement le plus ancien gagne, comme le
-- faisait le dédoublonnage de demarche/plan_action_exclusif.
UPDATE public.demarche d
SET plan_action_id = premier.plan_action_id
FROM (
    SELECT DISTINCT ON (demarche_id) demarche_id, plan_action_id
    FROM public.demarche_plan_action
    ORDER BY demarche_id, created_at, plan_action_id
) AS premier
WHERE premier.demarche_id = d.id;

DROP TABLE IF EXISTS public.demarche_plan_action;
DROP FUNCTION IF EXISTS public.demarche_plan_action_exclusif();

CREATE INDEX demarche_plan_action_id_idx ON public.demarche (plan_action_id);

-- Index de demarche/plan_action_exclusif, rétabli tel qu'il était.
CREATE UNIQUE INDEX demarche_plan_action_active_unique
    ON public.demarche (plan_action_id)
    WHERE plan_action_id IS NOT NULL
      AND status IN ('en_elaboration', 'transmis_pour_avis');

COMMIT;
