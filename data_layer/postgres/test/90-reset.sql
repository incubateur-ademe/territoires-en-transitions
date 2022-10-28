-- Fonction pour reset les données fake de la base

create function
    test_reset()
    returns void
as
$$
-- 02-droits.sql
    select test_reset_droits();
-- 04-membre.sql
    select test_reset_membres();
-- 06-auth.sql
    select test_reset_users();
-- 06-preuve.sql
    select test_reset_preuves();
-- 07-audit.sql
    select test_reset_audit();
-- 07-discussion.sql
-- select test_reset_discussion_et_commentaires();
$$ language sql security definer;
comment on function test_reset is
    'Reinitialise les données fake.';