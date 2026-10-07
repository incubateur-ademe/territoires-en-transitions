-- Deploy tet:demarche/plan_action_exclusif to pg

BEGIN;

-- Défense en profondeur : aujourd'hui le conflit est inatteignable via
-- l'application (une seule démarche active par collectivité et par type, et
-- un plan n'est rattachable que par sa propre collectivité), mais ni la FK ni
-- le service n'empêchent une écriture directe. On détache les doublons
-- éventuels (le rattachement le plus ancien gagne) avant de créer l'index.
WITH doublons AS (
    SELECT id,
           row_number() OVER (PARTITION BY plan_action_id ORDER BY id) AS rang
    FROM public.demarche
    WHERE plan_action_id IS NOT NULL
      AND status IN ('en_elaboration', 'transmis_pour_avis')
)
UPDATE public.demarche d
SET plan_action_id = NULL
FROM doublons
WHERE d.id = doublons.id
  AND doublons.rang > 1;

-- Un plan n'est tenu que par une seule démarche « en cours » (tous types
-- confondus) : une démarche adoptée ou archivée libère son plan.
CREATE UNIQUE INDEX demarche_plan_action_active_unique
    ON public.demarche (plan_action_id)
    WHERE plan_action_id IS NOT NULL
      AND status IN ('en_elaboration', 'transmis_pour_avis');

COMMIT;
