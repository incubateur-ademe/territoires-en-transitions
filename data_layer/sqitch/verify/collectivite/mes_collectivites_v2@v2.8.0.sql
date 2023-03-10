-- Verify tet:collectivite/mes_collectivites_v2 on pg

BEGIN;

select collectivite_id, nom, niveau_acces, est_auditeur
from collectivite_niveau_acces
where false;

select collectivite_id, nom, niveau_acces, est_auditeur
from mes_collectivites
where false;

select has_function_privilege('est_auditeur(integer)', 'execute');

ROLLBACK;
