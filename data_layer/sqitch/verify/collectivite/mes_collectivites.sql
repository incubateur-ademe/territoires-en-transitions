-- Verify tet:mes_collectivite on pg

BEGIN;

select collectivite_id, nom, niveau_acces, est_auditeur, access_restreint
from mes_collectivites
where false;

ROLLBACK;
