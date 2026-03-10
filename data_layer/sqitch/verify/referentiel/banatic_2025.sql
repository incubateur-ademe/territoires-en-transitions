-- Verify tet:referentiel/banatic_2025 on pg

BEGIN;

select 1
from banatic_2025_competence
limit 0;
select 1
from banatic_2021_2025_crosswalk
limit 0;
select 1
from collectivite_banatic_2025_competence
limit 0;
select 1
from collectivite_banatic_2025_transfert
limit 0;

ROLLBACK;
