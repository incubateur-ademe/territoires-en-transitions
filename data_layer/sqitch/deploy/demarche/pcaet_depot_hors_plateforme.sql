-- Deploy tet:demarche/pcaet_depot_hors_plateforme to pg
-- requires: demarche/pcaet_date_adoption
-- requires: demarche/plan_actions_multiples

BEGIN;

-- Une collectivité dont le PCAET a déjà été transmis pour avis hors de la
-- plateforme n'a ni élaboration ni transmission à rejouer : son dossier démarre
-- à l'étape de finalisation, et le circuit d'avis ne s'ouvre jamais pour lui.
--
-- Deux marques plutôt qu'une, parce qu'elles ne disent pas la même chose :
-- le statut porte l'état (où en est le dossier), la colonne porte la provenance
-- (d'où il vient). Le statut oublie tout une fois le dossier publié ; c'est
-- alors la colonne qui continue de tenir les écrans d'instruction à l'écart.
ALTER TABLE public.demarche
    ADD COLUMN transmitted_off_platform boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.demarche.transmitted_off_platform IS
    'Le PCAET a été transmis pour avis hors de la plateforme : la démarche démarre au statut instruit_hors_plateforme, sans demande d''avis ni échéance. Figé à la création, jamais modifié ensuite.';

ALTER TABLE public.demarche DROP CONSTRAINT demarche_status_check;

ALTER TABLE public.demarche ADD CONSTRAINT demarche_status_check CHECK (
    type = 'pcaet' AND status IN (
    'en_elaboration', 'transmis_pour_avis', 'instruit',
    'instruit_hors_plateforme', 'publie', 'archive'));

COMMENT ON COLUMN public.demarche.status IS
    'Cycle de vie du dépôt, propre au type. PCAET : en_elaboration → transmis_pour_avis (préfet de région, conseil régional, MRAe) → instruit (avis rendus ou délai échu ; finalisation du dépôt) → publie (adopté et mis à disposition du public, mise en œuvre 6 ans) → archive. instruit_hors_plateforme est l''autre entrée de la finalisation, pour un PCAET instruit ailleurs : la démarche y démarre. Transitions gérées par le domaine demarches.';

-- Les deux listes de statuts « en cours » écrites en dur dans le schéma sont
-- étendues au nouveau statut : un dépôt hors plateforme occupe l'étape de
-- finalisation dès sa création, et y rattache ses plans d'actions. Sans cela,
-- deux dépôts hors plateforme pourraient coexister, et un plan déjà tenu par
-- l'un être capté par l'autre.
--
-- `instruit` reste volontairement hors de ces listes, bien que le domaine le
-- compte parmi DEMARCHE_PCAET_EN_COURS_STATUSES : ce décalage préexiste, il est
-- tenu au niveau applicatif par `hasActiveDemarche`, et le combler ici ferait
-- échouer la création de l'index sur les bases où la course a déjà été franchie.
-- C'est une correction à mener séparément, avec la reprise de données qu'elle
-- suppose.

-- Une seule démarche « en cours » par collectivité et par type.
DROP INDEX public.demarche_active_unique;

CREATE UNIQUE INDEX demarche_active_unique
    ON public.demarche (collectivite_id, type)
    WHERE status IN ('en_elaboration', 'transmis_pour_avis',
                     'instruit_hors_plateforme');

-- Rattachement exclusif plan ↔ démarche active : même liste, même raison.
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
      AND d.status IN ('en_elaboration', 'transmis_pour_avis',
                       'instruit_hors_plateforme')
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
