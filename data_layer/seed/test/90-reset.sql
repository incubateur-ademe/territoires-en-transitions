-- Fonction pour reset les données fake de la base

create or replace function
    test_reset()
    returns void
as
$$
    truncate groupement_collectivite;
    select test_reset_groupements();
-- 02-droits.sql
    select test_reset_droits();
-- 04-membre.sql
    select test_reset_membres();
-- 05-history.sql
    select test_clear_history();
-- 06-preuve.sql
    select test_reset_preuves();
-- 07-audit.sql
    select test_reset_audit();
-- 07-discussion.sql
    select test_reset_discussion_et_commentaires();
-- 09-reponse.sql
    select test_reset_reponse();
-- 10-action.sql
    select test_reset_action_statut_and_desc();
-- 11-scores.sql
    select test_reset_scores();
-- 11-plan_action_et_indicateur.sql
    select test_reset_plan_action(); -- Reset les plans et les indicateurs
-- 06-auth.sql
    select test_reset_users();
-- Supprime toutes les collectivités de test et cot.
    delete from collectivite_test cascade where true;
    delete from cot where true;
-- Fix - Reset de la table fiche_action_pilote qui a été vidé lors du truncate dcp cascade
    select test.reset_from_copy('public', 'fiche_action_pilote');
    select test.reset_from_copy('public', 'fiche_action_referent');
-- Renvoie un code 200
    select set_config('response.status', '200', true);
$$ language sql security definer;
comment on function test_reset is
    'Reinitialise les données fake.';
