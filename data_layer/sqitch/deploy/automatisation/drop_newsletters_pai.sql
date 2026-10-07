-- Deploy tet:automatisation/drop_newsletters_pai to pg
-- requires: automatisation/newsletters_pai

BEGIN;

drop trigger after_upsert_from_panier_send_user on axe;

drop function automatisation.send_user_newsletters_new_pai();

delete from automatisation.supabase_function_url where nom = 'send_user_pai_to_brevo';

COMMIT;
