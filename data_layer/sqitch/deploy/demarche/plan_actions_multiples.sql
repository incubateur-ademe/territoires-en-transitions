-- Deploy tet:demarche/plan_actions_multiples to pg

BEGIN;

-- Le programme d'actions d'une démarche peut s'appuyer sur plusieurs plans
-- (un plan par thématique, un plan hérité repris tel quel…) : le rattachement
-- passe d'une colonne à une table de liaison.
CREATE TABLE public.demarche_plan_action (
    demarche_id    integer     NOT NULL REFERENCES public.demarche(id) ON DELETE CASCADE,
    plan_action_id integer     NOT NULL REFERENCES public.axe(id) ON DELETE CASCADE,
    created_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid        NULL,
    PRIMARY KEY (demarche_id, plan_action_id)
);

COMMENT ON TABLE public.demarche_plan_action IS
    'Plans d''action (axes racines) rattachés à une démarche pour son programme d''actions : une démarche peut en tenir plusieurs.';

-- Index de la FK portant un ON DELETE, et chemin de lecture de l'exclusivité.
CREATE INDEX demarche_plan_action_plan_action_id_idx
    ON public.demarche_plan_action (plan_action_id);

-- Reprise des rattachements existants avant de retirer la colonne (l'auteur du
-- rattachement n'était pas tracé sur la colonne : les liens repris restent
-- sans créateur).
INSERT INTO public.demarche_plan_action (demarche_id, plan_action_id)
SELECT id, plan_action_id
FROM public.demarche
WHERE plan_action_id IS NOT NULL;

DROP INDEX IF EXISTS public.demarche_plan_action_active_unique;
DROP INDEX IF EXISTS public.demarche_plan_action_id_idx;
ALTER TABLE public.demarche DROP COLUMN plan_action_id;

-- Exclusivité conservée : un plan n'est tenu que par une seule démarche « en
-- cours » (tous types confondus), une démarche adoptée ou archivée libère le
-- sien. Le statut vit sur `demarche`, hors de portée d'un index partiel sur la
-- table de liaison : un trigger prend le relais. Le verrou de la ligne `axe`
-- sérialise les rattachements concurrents du même plan, sans quoi deux
-- transactions liraient toutes deux un état sans conflit.
CREATE OR REPLACE FUNCTION public.demarche_plan_action_exclusif()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    titre_conflit text;
BEGIN
    PERFORM 1 FROM public.axe WHERE id = new.plan_action_id FOR UPDATE;

    SELECT d.titre
    INTO titre_conflit
    FROM public.demarche_plan_action l
             JOIN public.demarche d ON d.id = l.demarche_id
    WHERE l.plan_action_id = new.plan_action_id
      AND l.demarche_id <> new.demarche_id
      AND d.status IN ('en_elaboration', 'transmis_pour_avis')
    LIMIT 1;

    IF titre_conflit IS NOT NULL THEN
        RAISE EXCEPTION
            'demarche_plan_action_exclusif: le plan % est déjà rattaché à la démarche « % »',
            new.plan_action_id, titre_conflit
            USING ERRCODE = 'unique_violation';
    END IF;

    RETURN new;
END;
$$;

COMMENT ON FUNCTION public.demarche_plan_action_exclusif() IS
    'Défense en profondeur du rattachement exclusif plan ↔ démarche active : le service tranche déjà avec un message métier, le trigger couvre les écritures directes et les courses entre deux rattachements simultanés.';

CREATE TRIGGER demarche_plan_action_exclusif
    BEFORE INSERT OR UPDATE OF demarche_id, plan_action_id
    ON public.demarche_plan_action
    FOR EACH ROW
EXECUTE FUNCTION public.demarche_plan_action_exclusif();

-- RLS sans policy : seul service_role (backend NestJS) accède à cette table,
-- comme le reste du modèle demarche. Tout l'accès passe par tRPC.
ALTER TABLE public.demarche_plan_action ENABLE ROW LEVEL SECURITY;

COMMIT;
