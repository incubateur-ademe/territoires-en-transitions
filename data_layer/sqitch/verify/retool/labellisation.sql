-- Verify tet:retool/labellisation on pg

BEGIN;

select id,
       collectivite_id,
       referentiel,
       obtenue_le,
       annee,
       etoiles,
       score_realise,
       score_programme,
       collectivite_nom
from retool_labellisation
where false;

select id, en_cours, collectivite_id, referentiel, etoiles, date, nom
from retool_labellisation_demande
where false;

ROLLBACK;
