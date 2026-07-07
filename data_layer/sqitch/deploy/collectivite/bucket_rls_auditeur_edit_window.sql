-- Deploy tet:collectivite/bucket_rls_auditeur_edit_window to pg
-- requires: collectivite/bucket_rls_super_admin_write

BEGIN;

create or replace function private.est_auditeur_audit_dans_fenetre_edition(audit_id integer)
    returns boolean
    security definer
    language sql
    stable
begin
    atomic
    select coalesce(bool_or(
        a.date_fin is not null
        and (a.clos or a.valide)
        and a.date_fin > now() - interval '15 days'
    ), false)
    from labellisation.audit a
             join public.audit_auditeur aa on aa.audit_id = a.id
    where a.id = est_auditeur_audit_dans_fenetre_edition.audit_id
      and aa.auditeur = auth.uid();
end;
comment on function private.est_auditeur_audit_dans_fenetre_edition(integer) is
    'Vrai si l''utilisateur courant est auditeur de cet audit clos ou valide depuis moins de 15 jours (fenetre d''edition post-cloture, alignee sur AUDIT_REPORT_UPDATE_WINDOW_DAYS / canUpdateAuditReport).';

create or replace function private.est_auditeur_bucket_dans_fenetre_edition(bucket_id text)
    returns boolean
    security definer
    language sql
    stable
begin
    atomic
    select coalesce(bool_or(private.est_auditeur_audit_dans_fenetre_edition(a.id)), false)
    from public.collectivite_bucket cb
             join labellisation.audit a on a.collectivite_id = cb.collectivite_id
    where cb.bucket_id = est_auditeur_bucket_dans_fenetre_edition.bucket_id;
end;
comment on function private.est_auditeur_bucket_dans_fenetre_edition(text) is
    'Transpose est_auditeur_audit_dans_fenetre_edition au niveau du bucket (via collectivite_bucket), pour les policies storage.objects qui ne connaissent que le bucket.';

create policy allow_insert_auditeur_fenetre_edition on preuve_audit
    for insert with check (private.est_auditeur_audit_dans_fenetre_edition(audit_id));
create policy allow_update_auditeur_fenetre_edition on preuve_audit
    for update using (private.est_auditeur_audit_dans_fenetre_edition(audit_id));
create policy allow_delete_auditeur_fenetre_edition on preuve_audit
    for delete using (private.est_auditeur_audit_dans_fenetre_edition(audit_id));

create policy allow_insert_auditeur_fenetre_edition on storage.objects
    for insert with check (private.est_auditeur_bucket_dans_fenetre_edition(bucket_id));
create policy allow_update_auditeur_fenetre_edition on storage.objects
    for update with check (private.est_auditeur_bucket_dans_fenetre_edition(bucket_id));

COMMIT;
