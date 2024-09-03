-- Revert tet:automatisation/newsletters_pai from pg

BEGIN;

drop trigger after_upsert_from_panier_send_user on axe;

drop function automatisation.send_user_newsletters_new_pai();

COMMIT;
