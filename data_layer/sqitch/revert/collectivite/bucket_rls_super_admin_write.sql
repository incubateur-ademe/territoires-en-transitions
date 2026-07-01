-- Revert tet:collectivite/bucket_rls_super_admin_write from pg

BEGIN;

drop policy if exists allow_insert on preuve_complementaire;
create policy allow_insert
    on preuve_complementaire for insert
    with check (have_edition_acces(collectivite_id)
        or est_auditeur_action(collectivite_id, action_id));

drop policy if exists allow_update on preuve_complementaire;
create policy allow_update
    on preuve_complementaire for update
    using (have_edition_acces(collectivite_id)
        or est_auditeur_action(collectivite_id, action_id));

drop policy if exists allow_delete on preuve_complementaire;
create policy allow_delete
    on preuve_complementaire for delete
    using (have_edition_acces(collectivite_id)
        or est_auditeur_action(collectivite_id, action_id));

drop policy if exists allow_insert on preuve_reglementaire;
create policy allow_insert
    on preuve_reglementaire for insert
    with check (have_edition_acces(collectivite_id)
        or private.est_auditeur(collectivite_id));

drop policy if exists allow_update on preuve_reglementaire;
create policy allow_update
    on preuve_reglementaire for update
    using (have_edition_acces(collectivite_id)
        or private.est_auditeur(collectivite_id));

drop policy if exists allow_delete on preuve_reglementaire;
create policy allow_delete
    on preuve_reglementaire for delete
    using (have_edition_acces(collectivite_id)
        or private.est_auditeur(collectivite_id));

create or replace function
    is_bucket_writer(id text)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
where (is_any_role_on(cb.collectivite_id)
    or private.est_auditeur(cb.collectivite_id))
  and cb.bucket_id = is_bucket_writer.id
$$ language sql;
comment on function is_bucket_writer is
    'Returns true if current user can write on a bucket id';

drop function if exists est_super_admin();

COMMIT;
