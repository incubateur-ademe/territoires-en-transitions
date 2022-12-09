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
-- 05-history.sql
    select test_clear_history();
-- 06-auth.sql
    select test_reset_users();
-- 06-preuve.sql
    select test_reset_preuves();
-- 07-audit.sql
    select test_reset_audit();
-- 07-discussion.sql
-- select test_reset_discussion_et_commentaires();
-- 09-reponse.sql
    select test_reset_reponse();
-- 10-action.sql
    select test_reset_action_statut_and_desc();
-- 11-plan_action.sql
    select test_reset_plan_action();
$$ language sql security definer;
comment on function test_reset is
    'Reinitialise les données fake.';