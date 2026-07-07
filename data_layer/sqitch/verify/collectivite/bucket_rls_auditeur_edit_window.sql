-- Verify tet:collectivite/bucket_rls_auditeur_edit_window on pg

BEGIN;

select has_function_privilege('private.est_auditeur_audit_dans_fenetre_edition(integer)', 'execute');
select has_function_privilege('private.est_auditeur_bucket_dans_fenetre_edition(text)', 'execute');

ROLLBACK;
