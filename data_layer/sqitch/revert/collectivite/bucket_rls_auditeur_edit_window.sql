-- Revert tet:collectivite/bucket_rls_auditeur_edit_window from pg

BEGIN;

drop policy if exists allow_insert_auditeur_fenetre_edition on storage.objects;
drop policy if exists allow_update_auditeur_fenetre_edition on storage.objects;

drop policy if exists allow_insert_auditeur_fenetre_edition on preuve_audit;
drop policy if exists allow_update_auditeur_fenetre_edition on preuve_audit;
drop policy if exists allow_delete_auditeur_fenetre_edition on preuve_audit;

drop function if exists private.est_auditeur_bucket_dans_fenetre_edition(text);
drop function if exists private.est_auditeur_audit_dans_fenetre_edition(integer);

COMMIT;
