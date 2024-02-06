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

COMMIT;
