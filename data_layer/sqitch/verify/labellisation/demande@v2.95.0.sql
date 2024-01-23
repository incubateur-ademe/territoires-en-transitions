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
       envoyee_le,
       demandeur
from labellisation.demande
where false;

select has_function_privilege('labellisation_submit_demande(integer, referentiel, labellisation.sujet_demande, labellisation.etoile)', 'execute');


ROLLBACK;
