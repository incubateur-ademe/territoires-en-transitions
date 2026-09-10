-- Revert tet:stats/report_indicateur_resultat_periode from pg

BEGIN;

-- L'ancienne vue ne sait pas exprimer une cadence non annuelle. Le garde est
-- partagé avec le revert du catalogue afin d'arrêter un downgrade multi-étape
-- avant sa toute première modification.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
SELECT migration.verifier_retrait_periodicite_indicateur();

-- Les changements Sqitch sont validés dans des transactions distinctes. Ce
-- trigger survit donc aux deux intervalles entre reverts et ferme la course où
-- une définition mensuelle serait créée après ce contrôle mais avant le
-- retrait final de la colonne.
CREATE FUNCTION migration.empecher_periodicite_non_annuelle_pendant_retrait()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_TABLE_NAME = 'indicateur_definition' THEN
        IF NEW.periodicite_mode <> 'recommandee' THEN
            RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Un retrait de la périodicité est en cours';
        END IF;
    ELSIF TG_TABLE_NAME = 'indicateur_collectivite' THEN
        IF NEW.periodicite IS NOT NULL THEN
            RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Un retrait de la périodicité est en cours';
        END IF;
    END IF;
    IF COALESCE(NEW.periodicite, 'annuelle') <> 'annuelle' THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Un retrait de la périodicité est en cours ; aucune définition non annuelle ne peut être créée';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER empecher_periodicite_non_annuelle_pendant_retrait
    BEFORE INSERT OR UPDATE OF periodicite, periodicite_mode
    ON public.indicateur_definition
    FOR EACH ROW
    EXECUTE FUNCTION migration.empecher_periodicite_non_annuelle_pendant_retrait();

CREATE TRIGGER empecher_periodicite_non_annuelle_pendant_retrait
    BEFORE INSERT OR UPDATE OF periodicite ON public.indicateur_collectivite
    FOR EACH ROW EXECUTE FUNCTION migration.empecher_periodicite_non_annuelle_pendant_retrait();
CREATE TRIGGER empecher_periodicite_non_annuelle_pendant_retrait
    BEFORE INSERT OR UPDATE OF periodicite ON public.indicateur_valeur
    FOR EACH ROW EXECUTE FUNCTION migration.empecher_periodicite_non_annuelle_pendant_retrait();

DROP MATERIALIZED VIEW stats.report_indicateur_resultat;

CREATE MATERIALIZED VIEW stats.report_indicateur_resultat AS
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       valeur.indicateur_id,
       EXTRACT(YEAR FROM valeur.date_valeur) AS annee,
       valeur.resultat
FROM stats.collectivite c
JOIN public.indicateur_valeur valeur USING (collectivite_id)
WHERE valeur.resultat IS NOT NULL
ORDER BY c.collectivite_id, valeur.date_valeur;

COMMIT;
