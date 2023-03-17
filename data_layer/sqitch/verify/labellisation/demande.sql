-- Verify tet:labellisation/demande on pg

BEGIN;

select id,
       en_cours,
       collectivite_id,
       referentiel,
       etoiles,
       date,
       sujet,
       modified_at,
       envoyee_le
from labellisation.demande
where false;

ROLLBACK;
