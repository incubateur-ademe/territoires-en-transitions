-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

GRANT INSERT, UPDATE, DELETE ON audit TO authenticated;
GRANT INSERT, UPDATE, DELETE ON audit TO anon;
GRANT INSERT, UPDATE, DELETE ON audit TO service_role;

GRANT INSERT, UPDATE, DELETE ON audit_en_cours TO authenticated;
GRANT INSERT, UPDATE, DELETE ON audit_en_cours TO anon;
GRANT INSERT, UPDATE, DELETE ON audit_en_cours TO service_role;

GRANT INSERT, UPDATE, DELETE ON client_action_statut TO authenticated;
GRANT INSERT, UPDATE, DELETE ON client_action_statut TO anon;
GRANT INSERT, UPDATE, DELETE ON client_action_statut TO service_role;

GRANT INSERT, UPDATE, DELETE ON site_region TO authenticated;
GRANT INSERT, UPDATE, DELETE ON site_region TO anon;
GRANT INSERT, UPDATE, DELETE ON site_region TO service_role;

GRANT INSERT, UPDATE, DELETE ON plan_action TO authenticated;
GRANT INSERT, UPDATE, DELETE ON plan_action TO anon;
GRANT INSERT, UPDATE, DELETE ON plan_action TO service_role;

GRANT INSERT, UPDATE, DELETE ON plan_action_profondeur TO authenticated;
GRANT INSERT, UPDATE, DELETE ON plan_action_profondeur TO anon;
GRANT INSERT, UPDATE, DELETE ON plan_action_profondeur TO service_role;

drop function valider_audit;

COMMIT;
