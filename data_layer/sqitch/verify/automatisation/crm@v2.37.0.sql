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

select collectivite_id,
       key,
       completude_eci,
       completude_cae,
       fiches,
       plans,
       resultats_indicateurs,
       indicateurs_perso,
       resultats_indicateurs_perso,
       premier_rattachement
from crm_usages
where false;

ROLLBACK;
