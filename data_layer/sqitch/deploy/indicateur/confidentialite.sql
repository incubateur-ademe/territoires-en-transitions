-- Deploy tet:indicateur/confidentialite to pg

BEGIN;

alter view indicateurs set (security_invoker = on);

COMMIT;
