-- Deploy tet:retool/audit to pg

BEGIN;

drop view retool_audit;
create or replace view retool_audit as
with auditeur as (select audit_id, min(created_at) as date_attribution
                  from audit_auditeur aa
                  group by audit_id)
select a.collectivite_id,
       nc.nom,
       a.referentiel,
       a.date_debut,
       a.date_fin,
       a.date_cnl,
       a.valide_labellisation,
       a.clos,
       case
           when d is null then 'audit sans demande'
           else d.sujet::text
           end as type_audit,
       d.etoiles,
       d.envoyee_le as date_demande,
       auditeur.date_attribution as date_attribution_auditeur,
       a.id as audit_id,
       d.id as demande_id
from labellisation.audit a
         join named_collectivite nc using (collectivite_id)
         left join (
    select id, sujet, envoyee_le, etoiles
    from labellisation.demande
    where en_cours = false
) d on a.demande_id = d.id
         left join auditeur on auditeur.audit_id = a.id
where (a.date_debut is not null or d is not null)
and is_service_role();

create function retool_update_audit(
    audit_id integer,
    date_debut timestamptz,
    date_fin timestamptz,
    date_cnl timestamptz,
    valide boolean,
    valide_labellisation boolean,
    clos boolean
) returns void
    language plpgsql
    security definer
as
$$
begin
    if not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Seul le service role peut modifier directement l''audit';
    end if;

    if date_debut is not null then
        update labellisation.audit
        set date_debut = retool_update_audit.date_debut
        where id = retool_update_audit.audit_id;
    end if;

    if date_fin is not null then
        update labellisation.audit
        set date_fin = retool_update_audit.date_fin
        where id = retool_update_audit.audit_id;
    end if;

    if date_cnl is not null then
        update labellisation.audit
        set date_cnl = retool_update_audit.date_cnl
        where id = retool_update_audit.audit_id;
    end if;

    if valide is not null then
        update labellisation.audit
        set valide = retool_update_audit.valide
        where id = retool_update_audit.audit_id;
    end if;

    if valide_labellisation is not null then
        update labellisation.audit
        set valide_labellisation = retool_update_audit.valide_labellisation
        where id = retool_update_audit.audit_id;
    end if;

    if clos is not null then
        update labellisation.audit
        set clos = retool_update_audit.clos
        where id = retool_update_audit.audit_id;
    end if;

end
$$;

COMMIT;
