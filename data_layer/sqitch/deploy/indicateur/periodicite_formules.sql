-- Deploy tet:indicateur/periodicite_formules to pg
-- requires: indicateur/remplacer-catalogue-periodicites-par-contraintes
-- requires: indicateur/dependances_formules

BEGIN;

-- Les mutations applicatives prennent le même verrou avant les verrous de
-- lignes. La migration l'acquiert avant de valider les dépendances existantes.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;

-- Les références sont lues depuis les formules : aucun état dérivé à maintenir
-- ni à reconstruire après restauration.
CREATE FUNCTION private.verifier_periodicite_dependances_formule(
    indicateur_id_a_verifier integer DEFAULT NULL,
    sources_a_verifier text[] DEFAULT NULL
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog
AS $$
DECLARE
    conflit record;
BEGIN
    SELECT cible.id AS indicateur_id,
           cible.periodicite AS periodicite_cible,
           dependance.source_identifiant,
           source.id AS source_id,
           source.periodicite AS periodicite_source
    INTO conflit
    FROM public.indicateur_definition cible
    CROSS JOIN LATERAL private.extraire_dependances_formule_indicateur(
        cible.valeur_calcule
    ) AS dependance
    LEFT JOIN public.indicateur_definition source
      ON source.identifiant_referentiel = dependance.source_identifiant
    WHERE cible.valeur_calcule IS NOT NULL
      AND btrim(cible.valeur_calcule) <> ''
      AND (
        (
            indicateur_id_a_verifier IS NULL
            AND sources_a_verifier IS NULL
        )
        OR cible.id = indicateur_id_a_verifier
        OR dependance.source_identifiant = ANY (
            COALESCE(sources_a_verifier, ARRAY[]::text[])
        )
    ) AND (
        source.id IS NULL
        OR source.periodicite IS DISTINCT FROM cible.periodicite
    )
    ORDER BY cible.id, dependance.source_identifiant
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF conflit.source_id IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = format(
                'La formule de l''indicateur %s référence la définition inconnue %s',
                conflit.indicateur_id,
                conflit.source_identifiant
            );
    END IF;

    RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = format(
            'La formule de l''indicateur %s (%s) ne peut pas dépendre de %s (%s)',
            conflit.indicateur_id,
            conflit.periodicite_cible,
            conflit.source_identifiant,
            conflit.periodicite_source
        );
END;
$$;

CREATE FUNCTION private.verifier_periodicite_dependances_formule_trigger()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog
AS $$
DECLARE
    indicateur_id_a_verifier integer;
    sources_a_verifier text[];
BEGIN
    IF TG_OP = 'INSERT' THEN
        indicateur_id_a_verifier := NEW.id;
        sources_a_verifier := ARRAY[lower(NEW.identifiant_referentiel)];
    ELSIF TG_OP = 'DELETE' THEN
        sources_a_verifier := ARRAY[lower(OLD.identifiant_referentiel)];
    ELSE
        indicateur_id_a_verifier := NEW.id;
        sources_a_verifier := ARRAY[
            lower(OLD.identifiant_referentiel),
            lower(NEW.identifiant_referentiel)
        ];
    END IF;

    sources_a_verifier := array_remove(sources_a_verifier, NULL);

    PERFORM private.verifier_periodicite_dependances_formule(
        indicateur_id_a_verifier,
        sources_a_verifier
    );

    RETURN NULL;
END;
$$;

-- Échoue avant d'installer le contrat si le catalogue historique contient
-- une référence absente ou une arête entre deux périodicités différentes.
SELECT private.verifier_periodicite_dependances_formule();

-- INITIALLY IMMEDIATE donne un échec à la fin de l'instruction, une fois tous
-- les rows d'un import massif visibles. Une migration multi-instructions peut
-- explicitement différer ce trigger jusqu'au COMMIT sans affaiblir l'invariant.
-- Couvre aussi les changements de cadence avant l’installation de son immutabilité.
CREATE CONSTRAINT TRIGGER verifier_periodicite_dependances_formule
    AFTER INSERT OR DELETE OR UPDATE OF id, identifiant_referentiel,
                                     periodicite, valeur_calcule
    ON public.indicateur_definition
    DEFERRABLE INITIALLY IMMEDIATE
    FOR EACH ROW
    EXECUTE FUNCTION private.verifier_periodicite_dependances_formule_trigger();

REVOKE EXECUTE
    ON FUNCTION private.verifier_periodicite_dependances_formule(integer, text[]),
                private.verifier_periodicite_dependances_formule_trigger()
    FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
