-- Deploy tet:stats/report_indicateur_resultat_periode to pg
-- requires: indicateur/periodicite_obligatoire
-- requires: collectivite/fusion

BEGIN;

-- Peut exister après un revert isolé du reporting. Sa suppression dans la
-- même transaction rouvre les cadences non annuelles uniquement lorsque le
-- contrat de reporting qui sait les exprimer est restauré.
DROP TRIGGER IF EXISTS empecher_periodicite_non_annuelle_pendant_retrait
    ON public.indicateur_definition;
DROP TRIGGER IF EXISTS empecher_periodicite_non_annuelle_pendant_retrait ON public.indicateur_collectivite;
DROP TRIGGER IF EXISTS empecher_periodicite_non_annuelle_pendant_retrait ON public.indicateur_valeur;
DROP FUNCTION IF EXISTS migration.empecher_periodicite_non_annuelle_pendant_retrait();

DROP MATERIALIZED VIEW stats.report_indicateur_resultat;

CREATE MATERIALIZED VIEW stats.report_indicateur_resultat AS
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       valeur.indicateur_id,
       EXTRACT(YEAR FROM valeur.date_valeur) AS annee,
       valeur.resultat,
       -- Les six premières colonnes constituent le contrat historique de la
       -- vue (notamment pour les exports positionnels). Les nouvelles
       -- dimensions sont exclusivement ajoutées à la fin.
       valeur.periodicite,
       valeur.date_valeur AS periode_debut
FROM stats.collectivite c
JOIN public.indicateur_valeur valeur USING (collectivite_id)
JOIN public.indicateur_definition definition
  ON definition.id = valeur.indicateur_id
WHERE valeur.resultat IS NOT NULL
ORDER BY c.collectivite_id, valeur.date_valeur;

COMMENT ON COLUMN stats.report_indicateur_resultat.annee IS
    'Année conservée pour la compatibilité des consommateurs historiques.';
COMMENT ON COLUMN stats.report_indicateur_resultat.periodicite IS
    'Identifiant de la politique de périodicité qui donne son sens à periode_debut.';
COMMENT ON COLUMN stats.report_indicateur_resultat.periode_debut IS
    'Date canonique de début de la période du résultat.';

COMMIT;
