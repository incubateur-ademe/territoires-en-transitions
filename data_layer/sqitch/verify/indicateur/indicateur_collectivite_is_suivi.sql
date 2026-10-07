-- Verify tet:indicateur/indicateur_collectivite_is_suivi on pg

BEGIN;

select is_suivi from indicateur_collectivite where false;

ROLLBACK;
