-- Revert tet:evaluation/regle from pg

BEGIN;

drop function business_replace_personnalisations;
drop function business_upsert_personnalisations;
drop table personnalisation_regle;
drop table personnalisation;
drop type regle_type;

COMMIT;
