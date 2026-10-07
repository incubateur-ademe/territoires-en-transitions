-- Verify tet:referentiel/banatic_2025_perimetre on pg

BEGIN;

select nb_communes_transferees
from collectivite_banatic_2025_transfert
where false;

select collectivite_id, nb_communes_membres, created_at
from collectivite_banatic_2025_perimetre
where false;

ROLLBACK;
