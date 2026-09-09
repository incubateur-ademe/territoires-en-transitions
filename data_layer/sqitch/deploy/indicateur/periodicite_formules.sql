-- Deploy tet:indicateur/periodicite_formules to pg
-- requires: indicateur/periodicite_obligatoire
-- requires: indicateur/dependances_formules

BEGIN;

-- Le trigger statement-level de indicateur_definition prend le même verrou
-- avant les verrous de lignes. La migration l'acquiert explicitement avant
-- de construire et valider la projection sur un graphe immobile.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE private.indicateur_definition_dependance_calcul
(
    indicateur_id       integer NOT NULL
        REFERENCES public.indicateur_definition(id)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
    source_identifiant  text NOT NULL,
    PRIMARY KEY (indicateur_id, source_identifiant)
);

CREATE INDEX indicateur_definition_dependance_calcul_source_idx
    ON private.indicateur_definition_dependance_calcul (source_identifiant);

COMMENT ON TABLE private.indicateur_definition_dependance_calcul IS
    'Projection dérivée des références val/opt_val/cible/limite de valeur_calcule; seule la fonction trigger la maintient.';

REVOKE ALL ON TABLE private.indicateur_definition_dependance_calcul
    FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION private.synchroniser_dependances_formule_indicateur()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog
AS $$
BEGIN
    DELETE FROM private.indicateur_definition_dependance_calcul dependance
    WHERE dependance.indicateur_id = NEW.id;

    IF NEW.valeur_calcule IS NOT NULL
       AND btrim(NEW.valeur_calcule) <> '' THEN
        INSERT INTO private.indicateur_definition_dependance_calcul
            (indicateur_id, source_identifiant)
        SELECT NEW.id, dependance.source_identifiant
        FROM private.extraire_dependances_formule_indicateur(
            NEW.valeur_calcule
        ) AS dependance;
    END IF;

    RETURN NEW;
END;
$$;

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
    SELECT dependance.indicateur_id,
           cible.periodicite AS periodicite_cible,
           dependance.source_identifiant,
           source.id AS source_id,
           source.periodicite AS periodicite_source
    INTO conflit
    FROM private.indicateur_definition_dependance_calcul dependance
    JOIN public.indicateur_definition cible
      ON cible.id = dependance.indicateur_id
    LEFT JOIN public.indicateur_definition source
      ON source.identifiant_referentiel = dependance.source_identifiant
    WHERE (
        (
            indicateur_id_a_verifier IS NULL
            AND sources_a_verifier IS NULL
        )
        OR dependance.indicateur_id = indicateur_id_a_verifier
        OR dependance.source_identifiant = ANY (
            COALESCE(sources_a_verifier, ARRAY[]::text[])
        )
    ) AND (
        source.id IS NULL
        OR source.periodicite IS DISTINCT FROM cible.periodicite
    )
    ORDER BY dependance.indicateur_id, dependance.source_identifiant
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

INSERT INTO private.indicateur_definition_dependance_calcul
    (indicateur_id, source_identifiant)
SELECT definition.id, dependance.source_identifiant
FROM public.indicateur_definition definition
CROSS JOIN LATERAL private.extraire_dependances_formule_indicateur(
    definition.valeur_calcule
) AS dependance
WHERE definition.valeur_calcule IS NOT NULL
  AND btrim(definition.valeur_calcule) <> '';

-- Échoue avant d'installer le contrat si le catalogue historique contient
-- une référence absente ou une arête entre deux périodicités différentes.
SELECT private.verifier_periodicite_dependances_formule();

CREATE TRIGGER synchroniser_dependances_formule_indicateur
    AFTER INSERT OR UPDATE OF valeur_calcule
    ON public.indicateur_definition
    FOR EACH ROW
    EXECUTE FUNCTION private.synchroniser_dependances_formule_indicateur();

-- INITIALLY IMMEDIATE donne un échec à la fin de l'instruction, une fois tous
-- les rows d'un import massif visibles. Une migration multi-instructions peut
-- explicitement différer ce trigger jusqu'au COMMIT sans affaiblir l'invariant.
CREATE CONSTRAINT TRIGGER verifier_periodicite_dependances_formule
    AFTER INSERT OR DELETE OR UPDATE OF id, identifiant_referentiel,
                                     valeur_calcule, periodicite
    ON public.indicateur_definition
    DEFERRABLE INITIALLY IMMEDIATE
    FOR EACH ROW
    EXECUTE FUNCTION private.verifier_periodicite_dependances_formule_trigger();

REVOKE EXECUTE
    ON FUNCTION private.synchroniser_dependances_formule_indicateur(),
                private.verifier_periodicite_dependances_formule(integer, text[]),
                private.verifier_periodicite_dependances_formule_trigger()
    FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
