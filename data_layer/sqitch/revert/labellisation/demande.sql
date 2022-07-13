-- Revert tet:labellisation/demande from pg

BEGIN;

drop function labellisation_submit_demande(collectivite_id integer, referentiel referentiel, etoiles labellisation.etoile);
drop function labellisation_demande(collectivite_id integer, referentiel referentiel, etoiles labellisation.etoile);

COMMIT;
