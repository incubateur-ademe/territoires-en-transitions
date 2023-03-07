-- Deploy tet:retool/audit to pg

BEGIN;

create view retool_audit as
select a.collectivite_id,
       nc.nom,
       a.referentiel,
       a.date_debut,
       a.date_fin,
       case
           when d is null then 'sans labellisation'
           else d.sujet::text
           end as type_audit
from audit a
         join named_collectivite nc using (collectivite_id)
         left join (
    select *
    from labellisation.demande
    where en_cours = false
) d on a.demande_id = d.id
where (a.date_debut is not null or d is not null);

COMMIT;
