-- Deploy tet:collectivite/drop_mes_collectivites to pg
-- requires: collectivite/mes_collectivites

BEGIN;

drop view public.mes_collectivites;

COMMIT;
