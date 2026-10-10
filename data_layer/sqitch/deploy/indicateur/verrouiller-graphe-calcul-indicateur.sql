-- Deploy tet:indicateur/verrouiller-graphe-calcul-indicateur to pg
-- requires: indicateur/periodicite_schema
-- requires: demarche/pcaet_diagnostic_drop_referentiel_tables

BEGIN;

-- Fige d'abord les définitions puis leurs valeurs. Cet ordre laisse finir une
-- ancienne suppression de définition et sa cascade avant que la migration ne
-- détienne le verrou de la table de valeurs.
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

-- Les restrictions annuelles de periodicite_schema restent en place jusqu'à
-- la livraison qui active les autres cadences.

-- Les valeurs peuvent être écrites concurremment, mais leur calcul doit voir
-- un graphe de formules et de périodicités stable. Les triggers statement-level
-- prennent le verrou avant tout verrou de ligne, y compris pour un writer SQL
-- qui ne passe pas par les repositories applicatifs.
CREATE FUNCTION public.verrouiller_graphe_calcul_indicateur_partage()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock_shared(
        hashtextextended('indicateur-calculation-graph', 0)
    );
    RETURN NULL;
END;
$$;

CREATE FUNCTION public.verrouiller_graphe_calcul_indicateur_exclusif()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(
        hashtextextended('indicateur-calculation-graph', 0)
    );
    RETURN NULL;
END;
$$;

CREATE TRIGGER verrouiller_graphe_calcul_indicateur_valeur
    BEFORE INSERT OR UPDATE OR DELETE
    ON public.indicateur_valeur
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.verrouiller_graphe_calcul_indicateur_partage();

CREATE TRIGGER verrouiller_graphe_calcul_indicateur_definition
    BEFORE INSERT OR DELETE
    ON public.indicateur_definition
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.verrouiller_graphe_calcul_indicateur_exclusif();

CREATE TRIGGER verrouiller_graphe_calcul_indicateur_definition_update
    BEFORE UPDATE OF id, collectivite_id, identifiant_referentiel,
                     valeur_calcule, periodicite
    ON public.indicateur_definition
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.verrouiller_graphe_calcul_indicateur_exclusif();

REVOKE EXECUTE
    ON FUNCTION public.verrouiller_graphe_calcul_indicateur_partage(),
                public.verrouiller_graphe_calcul_indicateur_exclusif()
    FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
