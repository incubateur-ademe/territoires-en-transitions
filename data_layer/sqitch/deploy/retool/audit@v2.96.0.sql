-- Deploy tet:retool/audit to pg

BEGIN;

create or replace view retool_audit as
with auditeur as (select audit_id, min(created_at) as date_attribution
                  from audit_auditeur aa
                  group by audit_id)
select a.collectivite_id,
       nc.nom,
       a.referentiel,
       a.date_debut,
       a.date_fin,
       case
           when d is null then 'audit sans demande'
           else d.sujet::text
           end as type_audit,
       d.envoyee_le,
       auditeur.date_attribution
from labellisation.audit a
         join named_collectivite nc using (collectivite_id)
         left join (
    select id, sujet, envoyee_le
    from labellisation.demande
    where en_cours = false
) d on a.demande_id = d.id
         left join auditeur on auditeur.audit_id = a.id
where (a.date_debut is not null or d is not null);

COMMIT;
