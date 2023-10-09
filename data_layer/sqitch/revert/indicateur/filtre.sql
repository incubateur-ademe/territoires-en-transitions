-- Revert tet:indicateur/filtre from pg

BEGIN;

drop function filter_indicateurs;
drop view public.indicateur_resume;
drop view private.indicateur_resume;

COMMIT;
