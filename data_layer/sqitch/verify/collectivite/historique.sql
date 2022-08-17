-- Verify tet:collectivite/historique on pg

BEGIN;

select type,
       collectivite_id,
       action_id,
       modified_by,
       previous_modified_by,
       modified_at,
       previous_modified_at,
       avancement,
       previous_avancement,
       avancement_detaille,
       previous_avancement_detaille,
       concerne,
       previous_concerne,
       precision,
       previous_precision,
       tache_identifiant,
       tache_nom,
       action_identifiant,
       action_nom,
       modified_by_nom
from historique
where false;

ROLLBACK;
