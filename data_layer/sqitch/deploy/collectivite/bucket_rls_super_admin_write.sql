-- Deploy tet:collectivite/bucket_rls_super_admin_write to pg
-- requires: collectivite/bucket
-- requires: utilisateur/droits_v2
-- requires: labellisation/preuve_v2
-- requires: utilisateur/add-is-active-column-to-utilisateur-support

BEGIN;

create or replace function est_super_admin()
    returns boolean
    security definer
begin
    atomic
    select is_support_mode_enabled
    from utilisateur_support
    where user_id = auth.uid()
      and is_authenticated();
end;
comment on function est_super_admin is
    'Vrai si l''utilisateur courant a le mode support (super-admin) activé.';

create or replace function
    is_bucket_writer(id text)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
where (is_any_role_on(cb.collectivite_id)
    or private.est_auditeur(cb.collectivite_id)
    or est_super_admin())
  and cb.bucket_id = is_bucket_writer.id
$$ language sql;
comment on function is_bucket_writer is
    'Returns true if current user can write on a bucket id';

drop policy if exists allow_insert on preuve_complementaire;
create policy allow_insert
    on preuve_complementaire for insert
    with check (have_edition_acces(collectivite_id)
        or est_auditeur_action(collectivite_id, action_id)
        or est_super_admin());

drop policy if exists allow_update on preuve_complementaire;
create policy allow_update
    on preuve_complementaire for update
    using (have_edition_acces(collectivite_id)
        or est_auditeur_action(collectivite_id, action_id)
        or est_super_admin());

drop policy if exists allow_delete on preuve_complementaire;
create policy allow_delete
    on preuve_complementaire for delete
    using (have_edition_acces(collectivite_id)
        or est_auditeur_action(collectivite_id, action_id)
        or est_super_admin());

drop policy if exists allow_insert on preuve_reglementaire;
create policy allow_insert
    on preuve_reglementaire for insert
    with check (have_edition_acces(collectivite_id)
        or private.est_auditeur(collectivite_id)
        or est_super_admin());

drop policy if exists allow_update on preuve_reglementaire;
create policy allow_update
    on preuve_reglementaire for update
    using (have_edition_acces(collectivite_id)
        or private.est_auditeur(collectivite_id)
        or est_super_admin());

drop policy if exists allow_delete on preuve_reglementaire;
create policy allow_delete
    on preuve_reglementaire for delete
    using (have_edition_acces(collectivite_id)
        or private.est_auditeur(collectivite_id)
        or est_super_admin());

COMMIT;
