-- Revert tet:referentiel/action_score_indicateur_valeur from pg

BEGIN;

drop table action_score_indicateur_valeur;

COMMIT;
