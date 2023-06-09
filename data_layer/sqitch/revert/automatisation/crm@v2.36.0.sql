-- Deploy tet:utils/automatisation to pg

BEGIN;

drop view crm_droits;
drop view crm_collectivites;
drop view crm_personnes;

COMMIT;
