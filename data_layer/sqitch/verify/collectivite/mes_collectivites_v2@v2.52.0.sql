-- Verify tet:collectivite/mes_collectivites_v2 on pg

BEGIN;

select collectivite_id, nom, niveau_acces, est_auditeur, access_restreint
from collectivite_niveau_acces
where false;

ROLLBACK;
