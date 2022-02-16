-- Collectivité
select nom as collectivite_nom, collectivite_id, old_epci_id
from old.new_collectivites
         join named_collectivite on collectivite_id = new_collectivite_id
where nom like '%Ecueillé%';

-- Check statuts
with c as (
    select nom as collectivite_nom, collectivite_id, old_epci_id
    from old.new_collectivites
             join named_collectivite on collectivite_id = new_collectivite_id
    where nom like '%Ecueillé%'
    limit 1
)
select *
from old.actionstatus
         join c on epci_id = old_epci_id;


-- Import statuts
with c as (
    select nom as collectivite_nom, collectivite_id, old_epci_id
    from old.new_collectivites
             join named_collectivite on collectivite_id = new_collectivite_id
    where nom like '%Ecueillé%'
    limit 1
),
     emelyne as (
         select id
         from auth.users
         where email = 'e.joly@aere.fr'
         limit 1
     ),
     partitioned_old_statuts as (
         select *, row_number() over (partition by (action_id, epci_id) order by modified_at desc) as row_number
         from old.actionstatus
         where (action_id like 'citergie__%' or action_id like 'economie_circulaire__%')
     ),
     old_statuts as (
         select *
         from partitioned_old_statuts
         where row_number = 1
     ),
     converted_action_id as (
         select id,
                replace(replace(action_id, 'citergie__', 'cae_'), 'economie_circulaire__', 'eci_') as converted
         from old_statuts
     ),
     converted_statut as (
         select id,
                case
                    when avancement like 'non_concerne%' then 'non_renseigne'
                    when avancement = 'en_cours' then 'programme'
                    when avancement = 'programmee' then 'programme'
                    when avancement = 'faite' then 'fait'
                    when avancement = 'pas_faite' then 'pas_fait'
                    else 'non_renseigne'
                    end                             as avancement,
                avancement not like 'non_concerne%' as concerne
         from old_statuts
     )
insert
into action_statut (collectivite_id, action_id, avancement, concerne, modified_by, modified_at)
select c.collectivite_id,
       ca.converted as action_id,
       cs.avancement::avancement,
       cs.concerne,
       emelyne.id,
       os.modified_at
from old_statuts os
         join c on os.epci_id = c.old_epci_id
         join converted_statut cs on cs.id = os.id
         join converted_action_id ca on os.id = ca.id
         join action_relation r on ca.converted = r.id
         left join emelyne on true;


-- Import commentaire
with c as (
    select nom as collectivite_nom, collectivite_id, old_epci_id
    from old.new_collectivites
             join named_collectivite on collectivite_id = new_collectivite_id
    where nom like '%Ecueillé%'
    limit 1
),
     emelyne as (
         select id
         from auth.users
         where email = 'e.joly@aere.fr'
         limit 1
     ),
     partitioned_old_commentaire as (
         select *, row_number() over (partition by (action_id, epci_id) order by modified_at desc) as row_number
         from old.actionmeta
         where (action_id like 'citergie__%' or action_id like 'economie_circulaire__%')
     ),
     old_commentaire as (
         select *
         from partitioned_old_commentaire
         where row_number = 1
     ),
     converted_action_id as (
         select id,
                replace(replace(action_id, 'citergie__', 'cae_'), 'economie_circulaire__', 'eci_') as converted
         from old_commentaire
     )
insert
into action_commentaire (collectivite_id, action_id, commentaire, modified_by, modified_at)
select c.collectivite_id,
       a.converted,
       replace((oc.meta -> 'commentaire')::text, '"', ''),
       emelyne.id,
       oc.modified_at
from old_commentaire oc
         join converted_action_id a on oc.id = a.id
         join c on oc.epci_id = c.old_epci_id
         join action_relation r on a.converted = r.id
         left join emelyne on true;
