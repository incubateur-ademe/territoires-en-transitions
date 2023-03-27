-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

alter function private.est_auditeur(integer) set schema public;
-- on ne restaure pas l'ancienne fonction car elle se réfère à une colonne qui n'existe plus

COMMIT;
