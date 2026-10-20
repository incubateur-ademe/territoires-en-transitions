-- Manuel uniquement : ne pas inclure dans Sqitch, un seed ou un déploiement.
-- Sans -v apply=true, seul l'inventaire est exécuté.
\set ON_ERROR_STOP on
\if :{?apply}
\else
    \set apply false
\endif
-- Convertir avant toute action : une valeur invalide arrête psql.
SELECT :'apply'::boolean AS cleanup_apply \gset

\ir delete-arrondissements-paris-marseille.function.sql

\if :cleanup_apply
    BEGIN;
\else
    BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
\endif
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '5min';
SET LOCAL client_min_messages = notice;
SELECT pg_temp.delete_arrondissements_paris_marseille(:'cleanup_apply'::boolean)
    AS espaces_supprimes;
COMMIT;
