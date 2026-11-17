-- Deploy tet:indicateur/groupe_integrite to pg

BEGIN;

SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_groupe IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
    enfants_a_plusieurs_parents text;
    groupes_auto_references text;
    groupes_entre_collectivites text;
BEGIN
    SELECT string_agg(enfant::text, ', ' ORDER BY enfant)
    INTO enfants_a_plusieurs_parents
    FROM (
        SELECT enfant
        FROM public.indicateur_groupe
        GROUP BY enfant
        HAVING count(*) > 1
    ) doublons;

    IF enfants_a_plusieurs_parents IS NOT NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23505',
            MESSAGE = format(
                'Indicateurs enfants rattachés à plusieurs parents, à corriger avant la migration : %s',
                enfants_a_plusieurs_parents
            );
    END IF;

    SELECT string_agg(parent::text, ', ' ORDER BY parent)
    INTO groupes_auto_references
    FROM public.indicateur_groupe
    WHERE parent = enfant;

    IF groupes_auto_references IS NOT NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Indicateurs rattachés à eux-mêmes, à corriger avant la migration : %s',
                groupes_auto_references
            );
    END IF;

    SELECT string_agg(groupe.parent::text || '->' || groupe.enfant::text, ', ' ORDER BY groupe.parent, groupe.enfant)
    INTO groupes_entre_collectivites
    FROM public.indicateur_groupe groupe
    JOIN public.indicateur_definition parent ON parent.id = groupe.parent
    JOIN public.indicateur_definition enfant ON enfant.id = groupe.enfant
    WHERE (parent.collectivite_id IS NOT NULL OR enfant.collectivite_id IS NOT NULL)
      AND parent.collectivite_id IS DISTINCT FROM enfant.collectivite_id;

    IF groupes_entre_collectivites IS NOT NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Groupes dont le parent et l''enfant n''ont pas la même collectivité, à corriger avant la migration (parent->enfant) : %s',
                groupes_entre_collectivites
            );
    END IF;
END;
$$;

ALTER TABLE public.indicateur_groupe
    ADD CONSTRAINT indicateur_groupe_enfant_unique UNIQUE (enfant),
    ADD CONSTRAINT indicateur_groupe_parent_distinct_enfant CHECK (parent <> enfant);

CREATE FUNCTION public.verifier_collectivite_groupe_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    collectivite_parent integer;
    collectivite_enfant integer;
BEGIN
    SELECT parent.collectivite_id, enfant.collectivite_id
    INTO collectivite_parent, collectivite_enfant
    FROM public.indicateur_definition parent
    CROSS JOIN public.indicateur_definition enfant
    WHERE parent.id = NEW.parent
      AND enfant.id = NEW.enfant;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = 'Les deux définitions du groupe doivent exister';
    END IF;

    IF (collectivite_parent IS NOT NULL OR collectivite_enfant IS NOT NULL)
       AND collectivite_parent IS DISTINCT FROM collectivite_enfant THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Le parent %s et l''enfant %s d''un groupe personnalisé doivent appartenir à la même collectivité',
                NEW.parent,
                NEW.enfant
            );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER verifier_collectivite_groupe_indicateur
    BEFORE INSERT OR UPDATE OF parent, enfant
    ON public.indicateur_groupe
    FOR EACH ROW
    EXECUTE FUNCTION public.verifier_collectivite_groupe_indicateur();

COMMIT;
