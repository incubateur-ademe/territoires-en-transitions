-- Revert tet:demarche/pcaet_depot_hors_plateforme from pg

BEGIN;

-- Les dossiers hors plateforme n'ont pas d'équivalent dans l'ancien cycle : les
-- ramener à `instruit` est le seul repli qui conserve leur étape. Ils perdent
-- alors leur provenance, et leur amont se referme.
UPDATE public.demarche
SET status = 'instruit'
WHERE status = 'instruit_hors_plateforme';

ALTER TABLE public.demarche DROP CONSTRAINT demarche_status_check;

ALTER TABLE public.demarche ADD CONSTRAINT demarche_status_check CHECK (
    type = 'pcaet' AND status IN (
    'en_elaboration', 'transmis_pour_avis', 'instruit', 'publie', 'archive'));

ALTER TABLE public.demarche DROP COLUMN transmitted_off_platform;

DROP INDEX public.demarche_active_unique;

CREATE UNIQUE INDEX demarche_active_unique
    ON public.demarche (collectivite_id, type)
    WHERE status IN ('en_elaboration', 'transmis_pour_avis');

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

COMMIT;
