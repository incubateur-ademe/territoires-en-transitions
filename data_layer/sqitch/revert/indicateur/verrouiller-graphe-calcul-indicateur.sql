-- Revert tet:indicateur/verrouiller-graphe-calcul-indicateur from pg

BEGIN;

-- Prendre le verrou du graphe avant les tables respecte le même ordre que les
-- writers applicatifs et les triggers statement-level. Une fois exclusif, le
-- revert peut retirer ces triggers sans qu'une écriture ne s'intercale.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER IF EXISTS verrouiller_graphe_calcul_indicateur_valeur
    ON public.indicateur_valeur;
DROP TRIGGER IF EXISTS verrouiller_graphe_calcul_indicateur_definition_update
    ON public.indicateur_definition;
DROP TRIGGER IF EXISTS verrouiller_graphe_calcul_indicateur_definition
    ON public.indicateur_definition;
DROP FUNCTION IF EXISTS public.verrouiller_graphe_calcul_indicateur_partage();
DROP FUNCTION IF EXISTS public.verrouiller_graphe_calcul_indicateur_exclusif();

-- Les colonnes, index de préparation et restrictions annuelles restent en place.

COMMIT;
