-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

REVOKE INSERT, UPDATE, DELETE ON audit FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit FROM anon;
REVOKE INSERT, UPDATE, DELETE ON audit FROM service_role;

REVOKE INSERT, UPDATE, DELETE ON audit_en_cours FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit_en_cours FROM anon;
REVOKE INSERT, UPDATE, DELETE ON audit_en_cours FROM service_role;

REVOKE INSERT, UPDATE, DELETE ON client_action_statut FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON client_action_statut FROM anon;
REVOKE INSERT, UPDATE, DELETE ON client_action_statut FROM service_role;

REVOKE INSERT, UPDATE, DELETE ON site_region FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON site_region FROM anon;
REVOKE INSERT, UPDATE, DELETE ON site_region FROM service_role;

REVOKE INSERT, UPDATE, DELETE ON plan_action FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON plan_action FROM anon;
REVOKE INSERT, UPDATE, DELETE ON plan_action FROM service_role;

REVOKE INSERT, UPDATE, DELETE ON plan_action_profondeur FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON plan_action_profondeur FROM anon;
REVOKE INSERT, UPDATE, DELETE ON plan_action_profondeur FROM service_role;

-- Pour remplacer la possibilité d'update sur la vue audit
create function valider_audit (audit_id integer) returns audit as
$$
declare
    to_return audit;
begin
    if not est_auditeur_audit(valider_audit.audit_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''est pas l''auditeur de cet audit';
    end if;

    update labellisation.audit
    set valide = true
    where id = valider_audit.audit_id;

    select * from audit where id = valider_audit.audit_id limit 1 into to_return;

    return to_return;
end
$$ language plpgsql security definer;

COMMIT;
