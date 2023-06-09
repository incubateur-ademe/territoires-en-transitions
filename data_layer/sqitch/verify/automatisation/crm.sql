-- Verify tet:utils/automatisation on pg

BEGIN;

select id,
       collectivite_key,
       referentiel,
       obtenue_le,
       annee,
       etoiles,
       score_realise,
       score_programme
from crm_labellisations
where false;

ROLLBACK;
