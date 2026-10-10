-- Revert tet:stats/report_indicateur_resultat_periode from pg

BEGIN;

-- Sqitch rétablit les restrictions annuelles dans le revert de l'activation
-- avant de revenir à la vue historique.
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
