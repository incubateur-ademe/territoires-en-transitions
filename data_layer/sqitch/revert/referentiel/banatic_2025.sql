-- Revert tet:referentiel/banatic_2025 from pg

BEGIN;

drop table if exists collectivite_banatic_2025_transfert;
drop table if exists collectivite_banatic_2025_competence;
drop table if exists banatic_2021_2025_crosswalk;
drop table if exists banatic_2025_competence;

COMMIT;
