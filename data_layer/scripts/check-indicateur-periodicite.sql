-- Rapport avant migration : aucune donnée ni aucun schéma n'est modifié.
-- Exécuter avec psql --no-psqlrc --file=... sur une copie récente de la base.
-- Sans colonne periodicite, les valeurs historiques sont toutes annuelles.
-- Avec cette colonne, respecter la périodicité de chaque valeur.
\set ON_ERROR_STOP on

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
-- Refuser un rapport incomplet si le rôle ne peut pas lire toutes les lignes.
SET LOCAL row_security = off;
SET LOCAL DateStyle = 'ISO, YMD';

SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.indicateur_valeur'::regclass
      AND attname = 'periodicite'
      AND NOT attisdropped
) AS has_periodicite
\gset

\if :has_periodicite
    \set periodicite_expression 'valeur.periodicite'
\else
    \set periodicite_expression '''annuelle''::text'
\endif

WITH dates AS (
    SELECT valeur.id AS valeur_id,
           valeur.indicateur_id,
           valeur.collectivite_id,
           valeur.metadonnee_id,
           :periodicite_expression AS periodicite,
           valeur.date_valeur AS date_avant,
           CASE
               WHEN valeur.date_valeur BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'
               THEN CASE :periodicite_expression
                   WHEN 'annuelle' THEN date_trunc('year', valeur.date_valeur::timestamp)::date
                   WHEN 'mensuelle' THEN date_trunc('month', valeur.date_valeur::timestamp)::date
               END
           END AS date_canonique
    FROM public.indicateur_valeur valeur
), periodes AS (
    SELECT dates.*,
           -- PARTITION BY regroupe aussi les metadonnee_id NULL (saisie manuelle).
           count(*) OVER (
               PARTITION BY indicateur_id, collectivite_id, metadonnee_id,
                            periodicite, date_canonique
           ) AS nombre_valeurs_periode
    FROM dates
), rapport AS (
    SELECT CASE
               WHEN periodicite IS NULL OR periodicite NOT IN ('annuelle', 'mensuelle')
                   THEN 'periodicite_inconnue'
               WHEN date_canonique IS NULL THEN 'date_invalide'
               WHEN nombre_valeurs_periode > 1 THEN 'conflit'
               WHEN date_avant <> date_canonique THEN 'a_normaliser'
           END AS statut,
           valeur_id,
           indicateur_id,
           collectivite_id,
           metadonnee_id,
           periodicite,
           date_avant,
           date_canonique,
           nombre_valeurs_periode
    FROM periodes
)
SELECT *
FROM rapport
WHERE statut IS NOT NULL
ORDER BY indicateur_id, collectivite_id, metadonnee_id NULLS FIRST,
         periodicite, date_canonique, date_avant, valeur_id;

COMMIT;
