-- Verify tet:collectivite/mes_collectivites_v2 on pg

BEGIN;

select collectivite_id, nom, niveau_acces
from collectivite_niveau_acces
where false;

select collectivite_id, nom, niveau_acces
from mes_collectivites
where false;

ROLLBACK;
