-- Verify tet:retool/labellisation on pg

BEGIN;


select id, en_cours,
       collectivite_id,
       referentiel,
       etoiles,
       nom,
       sujet,
       envoyee_le,
       date,
       modified_at
from retool_labellisation_demande
where false;

ROLLBACK;
