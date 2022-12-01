-- Verify tet:collectivite/historique on pg

BEGIN;

select collectivite_id, modified_by_id, modified_by_nom
from historique_utilisateur
where false;

ROLLBACK;
