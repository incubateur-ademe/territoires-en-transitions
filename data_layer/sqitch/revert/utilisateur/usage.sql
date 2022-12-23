-- Revert tet:utilisateur/usage from pg

BEGIN;

drop table usage;

drop type usage_action;
drop type usage_fonction;
drop type usage_emplacement;

COMMIT;
