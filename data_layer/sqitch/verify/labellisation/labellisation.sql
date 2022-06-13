-- Verify tet:labellisation/labellisation on pg

BEGIN;

select id,
       collectivite_id,
       referentiel,
       obtenue_le,
       annee,
       etoiles,
       score_realise,
       score_programme
from labellisation
where false;

ROLLBACK;
