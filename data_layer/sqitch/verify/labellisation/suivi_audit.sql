-- Verify tet:labellisation/suivi_audit on pg

BEGIN;

select collectivite_id,
       referentiel,
       action_id,
       have_children,
       type,
       statut,
       statuts,
       avis,
       ordre_du_jour,
       ordres_du_jour
from suivi_audit
where false;

ROLLBACK;
