-- Revert tet:referentiel/banatic_2025_perimetre from pg

BEGIN;

drop table if exists collectivite_banatic_2025_perimetre;

alter table collectivite_banatic_2025_transfert
    drop column if exists nb_communes_transferees;

COMMIT;
