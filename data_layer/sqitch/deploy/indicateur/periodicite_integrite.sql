-- Deploy tet:indicateur/periodicite_integrite to pg
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('indicateur-calculation-graph', 0));
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Prépare les règles de cohérence sans ouvrir de nouvelle cadence.
-- Les contraintes annuelles restent actives jusqu’à periodicite_activation.
CREATE FUNCTION public.empecher_changement_periodicite_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    IF COALESCE(OLD.periodicite, 'annuelle')
           IS DISTINCT FROM COALESCE(NEW.periodicite, 'annuelle') THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'La périodicité de l''indicateur %s est fixée à sa création',
                OLD.id
            );
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.empecher_changement_periodicite_indicateur() IS
    'Interdit de changer la périodicité de déclaration après création, même sans valeur.';

CREATE TRIGGER empecher_changement_periodicite_indicateur
    BEFORE UPDATE OF periodicite
    ON public.indicateur_definition
    FOR EACH ROW
    EXECUTE FUNCTION public.empecher_changement_periodicite_indicateur();

-- Un groupe est une agrégation, pas une règle implicite de conversion.
-- Les deux définitions doivent partager la cadence fixée à leur création.
CREATE FUNCTION public.verifier_periodicite_groupe_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    periodicite_parent text;
    periodicite_enfant text;
BEGIN
    SELECT parent.periodicite, enfant.periodicite
    INTO periodicite_parent, periodicite_enfant
    FROM public.indicateur_definition parent
    CROSS JOIN public.indicateur_definition enfant
    WHERE parent.id = NEW.parent
      AND enfant.id = NEW.enfant;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = 'Les deux définitions du groupe doivent exister';
    END IF;

    IF COALESCE(periodicite_parent, 'annuelle')
           IS DISTINCT FROM COALESCE(periodicite_enfant, 'annuelle') THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Le parent %s et l''enfant %s d''un groupe doivent avoir la même périodicité',
                NEW.parent,
                NEW.enfant
            );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER verifier_periodicite_groupe_indicateur
    BEFORE INSERT OR UPDATE OF parent, enfant
    ON public.indicateur_groupe
    FOR EACH ROW
    EXECUTE FUNCTION public.verifier_periodicite_groupe_indicateur();

COMMENT ON COLUMN public.indicateur_definition.periodicite IS
    'Périodicité commune à la déclaration et à la visualisation, immuable après création.';

-- Les déclarations locales, y compris celles du diagnostic PCAET identifiées
-- par une métadonnée interne, suivent leur définition. Les sources importées
-- (dont pcaet) conservent leur cadence d'origine et leur identité indépendante.
CREATE FUNCTION public.verifier_periodicite_valeur_indicateur()
    RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog, public AS $$
DECLARE
    definition_periodicite text;
BEGIN
    SELECT periodicite INTO definition_periodicite
    FROM public.indicateur_definition
    WHERE id = NEW.indicateur_id FOR SHARE;

    IF TG_OP = 'UPDATE' AND NEW.periodicite IS DISTINCT FROM OLD.periodicite THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'La périodicité d''une valeur enregistrée est immuable';
    END IF;

    IF (NEW.metadonnee_id IS NULL OR EXISTS (
        SELECT 1 FROM public.indicateur_source_metadonnee metadonnee
        WHERE metadonnee.id = NEW.metadonnee_id
          AND metadonnee.source_id = 'pcaet-collectivite'
    )) AND NEW.periodicite IS DISTINCT FROM COALESCE(definition_periodicite, 'annuelle') THEN
        RAISE EXCEPTION USING ERRCODE = '23514',
            MESSAGE = 'La déclaration locale doit respecter la périodicité de sa définition';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER verifier_periodicite_valeur_indicateur
    BEFORE INSERT OR UPDATE ON public.indicateur_valeur
    FOR EACH ROW EXECUTE FUNCTION public.verifier_periodicite_valeur_indicateur();

COMMIT;
