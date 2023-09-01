-- Verify tet:collectivite/mes_collectivites_v2 on pg

BEGIN;

select collectivite_id, nom, niveau_acces, est_auditeur
from public.mes_collectivites
where false;

ROLLBACK;
