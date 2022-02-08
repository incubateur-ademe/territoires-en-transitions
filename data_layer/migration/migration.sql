-- view utils
--- new collectivite / old epci
create or replace view old.new_collectivites
as
with new_epcis as (select oe.uid            as old_epci_id,
                          e.collectivite_id as new_collectivite_id
                   from epci e
                            join old.epci oe on e.siren = oe.siren
                   where oe.latest),

     new_communes as (select oe.uid            as old_epci_id,
                             c.collectivite_id as new_collectivite_id
                      from commune c
                               join old.epci oe on c.code = oe.insee
                      where oe.latest)
select *
from new_epcis
union all
select *
from new_communes;

select n.nom, old.epci.nom
from old.new_collectivites
         join named_collectivite n on collectivite_id = new_collectivite_id
         left join old.epci on uid = old_epci_id
; -- 315

--- old indicateur id / new indicateur id
create or replace view old.new_indicateur_id
as
with all_ids as (
    select indicateur_id
    from old.indicateurresultat
    union
    select indicateur_id
    from old.indicateurobjectif
    union
    select replace(jsonb_array_elements(referentiel_indicateur_ids) :: text, '"', '')::varchar(36) as indicateur_id
    from old.ficheaction
)
select distinct regexp_replace(
                        regexp_replace(
                                regexp_replace(
                                        regexp_replace(
                                                indicateur_id,
                                            -- first crte
                                                'crte-(\d+).(\d+)', 'crte_\1.\2'
                                            ),
                                    -- second eci
                                        'eci-(0+)(\d+)', 'eci_\2'
                                    ),

                            -- third cae
                                'cae-(\d+)([a-z]+)', 'cae_\1.\2'
                            ),
                    -- cae again
                        'cae-(\d+)', 'cae_\1'
                    )
                              as new_id,
                indicateur_id as old_id
from all_ids
where indicateur_id like 'eci%'
   or indicateur_id like 'cae%'
   or indicateur_id like 'crte%'
;



-- 2. Import users
create function old.migrate_user(
    id uuid,
    email text
) returns void
as
$$
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at,
                        confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
                        email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
                        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone,
                        phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
                        email_change_token_current, email_change_confirm_status)
VALUES ('00000000-0000-0000-0000-000000000000', migrate_user.id, '', 'authenticated',
        migrate_user.email, '$2a$10$vBZp2SU5Rxedb1DLsaBtP.9bu3PeNDhy9dQ7ye9ikIuw66gM4gedi',
        '2021-12-03 10:17:09.205161 +00:00', null, '', null, '', null, '', '', null,
        '2021-12-03 10:17:09.209968 +00:00', '{
    "provider": "email"
  }', 'null', false, '2021-12-03 10:17:09.201674 +00:00', '2021-12-03 10:17:09.201674 +00:00', null, null, '', '', null,
        '', 0);
$$ language sql volatile;


with unique_users as (
    select au.email, ademe_user_id
    from old.ademeutilisateur au
             left join auth.users u on u.email = au.email
    where u.email is null
    group by ademe_user_id, au.email
)
select *
from unique_users,
    lateral old.migrate_user(ademe_user_id::uuid, email);
select count(*)
from auth.users;
-- 501, 611 after second run ?

-- 3 dcp
with unique_dcp as (
    select ademe_user_id, ademeutilisateur.email, nom, prenom, ademeutilisateur.created_at, modified_at
    from old.ademeutilisateur
             join auth.users u on ademe_user_id::uuid = u.id
)
insert
into dcp (user_id, nom, prenom, email, created_at, modified_at)
select ademe_user_id::uuid, nom, prenom, email, created_at, modified_at
from unique_dcp;
select count(*)
from dcp; --621

select distinct user_id
from dcp
except
select id
from auth.users; -- should be 0

select count(*)
from dcp
         left join auth.users on dcp.user_id = users.id
;
-- 621

-- 4 droits
---- 4.a EPCIs
with unique_droits as (
    select od.ademe_user_id,
           new_collectivite_id,
           od.epci_id as old_epci_id,
           od.created_at
    from old.utilisateurdroits od
             join auth.users u on od.ademe_user_id::uuid = u.id
             join old.new_collectivites on old_epci_id = od.epci_id
    where latest
      and ecriture
)
insert
into private_utilisateur_droit (user_id, collectivite_id, role_name, active, created_at)
select d.ademe_user_id::uuid, new_collectivite_id, 'referent', true, d.created_at
from unique_droits d;

select count(*)
from private_utilisateur_droit; -- 456
select count(*)
from old.utilisateurdroits; -- 634

select nom, email, nc.collectivite_id
from private_utilisateur_droit
         join named_collectivite nc on private_utilisateur_droit.collectivite_id = nc.collectivite_id
         join auth.users on private_utilisateur_droit.user_id = users.id
;
-- 456


-- 5 Actions
-- 5.a Action statuts
with partitioned_old_statuts as (
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
select nc.new_collectivite_id as collectivite_id,
       ca.converted           as action_id,
       cs.avancement::avancement,
       cs.concerne,
       ud.user_id,
       os.modified_at
from old_statuts os
         join old.new_collectivites nc on os.epci_id = nc.old_epci_id
         join converted_statut cs on cs.id = os.id
         join converted_action_id ca on os.id = ca.id
         join action_relation r on ca.converted = r.id
         join lateral (
    select *
    from private_utilisateur_droit d
    where nc.new_collectivite_id = d.collectivite_id
    limit 1
    ) ud on true
on conflict do nothing
;

select count(*)
from old.actionstatus oa
         join old.new_collectivites nc on nc.old_epci_id = oa.epci_id
where latest -- 23645
;
select count(*)
from action_statut;
-- 20215

-- 5.b Action commentaire
with partitioned_old_commentaire as (
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
select nc.new_collectivite_id,
       a.converted,
       replace((oc.meta -> 'commentaire')::text, '"', ''),
       u.user_id,
       oc.modified_at

from old_commentaire oc
         join converted_action_id a on oc.id = a.id
         join old.new_collectivites nc on oc.epci_id = nc.old_epci_id
         join action_relation r on a.converted = r.id
         join lateral (select user_id
                       from private_utilisateur_droit d
                       where d.collectivite_id = nc.new_collectivite_id
                       limit 1) u on true
on conflict do nothing
;

select count(*)
from old.actionmeta am
         join old.new_collectivites nc on nc.old_epci_id = am.epci_id
where latest -- 6899
;
select count(*)
from action_commentaire;
-- 6168


-- 6 - résultats des indicateurs référentiels
with partitioned_old_indicateur_resultats as (
    select *, row_number() over (partition by (indicateur_id, epci_id, year) order by modified_at desc) as row_number
    from old.indicateurresultat
),
     old_indicateur_resultats as (
         select *
         from partitioned_old_indicateur_resultats
         where row_number = 1
     )
insert
into indicateur_resultat (collectivite_id, indicateur_id, valeur, annee, modified_at)
select nc.new_collectivite_id as collectivite_id,
       nii.new_id             as indicateur_id,
       oir.value              as valeur,
       oir.year               as annee,
       modified_at

from old_indicateur_resultats oir
         join old.new_indicateur_id nii on oir.indicateur_id = nii.old_id
         join old.new_collectivites nc on oir.epci_id = nc.old_epci_id
on conflict do nothing
;

---- Missing indicateurs resultats from real epcis
select distinct indicateur_id
from old.indicateurresultat oi
         join old.new_collectivites nc on nc.old_epci_id = oi.epci_id
except
select distinct old_id
from indicateur_resultat ir
         join old.new_indicateur_id oni on ir.indicateur_id = oni.new_id;


-- 7 - objectifs des indicateurs référentiels
with partitioned_old_indicateur_objectifs as (
    select *, row_number() over (partition by (indicateur_id, epci_id, year) order by modified_at desc) as row_number
    from old.indicateurobjectif
),
     old_indicateur_objectifs as (
         select *
         from partitioned_old_indicateur_objectifs
         where row_number = 1
     )
insert
into indicateur_objectif (collectivite_id, indicateur_id, valeur, annee, modified_at)
select nc.new_collectivite_id as collectivite_id,
       nii.new_id             as indicateur_id,
       oir.value              as valeur,
       oir.year               as annee,
       modified_at

from old_indicateur_objectifs oir
         join old.new_indicateur_id nii on oir.indicateur_id = nii.old_id
         join old.new_collectivites nc on oir.epci_id = nc.old_epci_id
on conflict do nothing
;

---- Missing indicateurs objectifs from real epcis
select distinct indicateur_id
from old.indicateurobjectif oio
         join old.new_collectivites nc on nc.old_epci_id = oio.epci_id
except
select distinct old_id
from indicateur_resultat ir
         join old.new_indicateur_id oni on ir.indicateur_id = oni.new_id;


-- 8 - définitions, résultats et objectifs des indicateurs personnalisés
-- a. mapping from old indicateur perso uid to new integer id
create materialized view old.indicateur_perso_uid_mapping as
with seq as (
    select coalesce(max(id), 0) as last_id
    from indicateur_personnalise_definition
)
select distinct on (uid) uid                                           old_uid,
                         row_number() OVER (ORDER BY uid) + last_id as new_id,
                         epci_id
from old.indicateurpersonnalise
         join seq on true;

-- b. Définitions des indicateurs personnalisés
with partitioned as (
    select *, row_number() over (partition by (uid, epci_id) order by modified_at desc) as row_number
    from old.indicateurpersonnalise
),
     old_indicateur_personnalise_definition as (
         select *
         from partitioned
         where row_number = 1
     ),
     data as (
         select mapping.new_id              id,
                nc.new_collectivite_id      collectivite_id,
                nom                         titre,
                description,
                unite,
                meta -> 'commentaire'::text commentaire,
                ud.user_id                  modified_by,
                oipd.modified_at            modified_at
         from old_indicateur_personnalise_definition oipd
                  join old.indicateur_perso_uid_mapping mapping on mapping.old_uid = oipd.uid
                  join old.new_collectivites nc on oipd.epci_id = nc.old_epci_id
                  join lateral (select *
                                from private_utilisateur_droit
                                where collectivite_id = nc.new_collectivite_id
                                limit 1) ud
                       on true
     )
insert
into indicateur_personnalise_definition(id, collectivite_id, titre, description, unite, commentaire,
                                        modified_by, modified_at)
select id,
       collectivite_id,
       titre,
       description,
       unite,
       replace(coalesce(commentaire::text, ''), '"', '') as commentaire,
       modified_by,
       modified_at
from data
;

---- Missing indicateurs personnalise definitions from real epcis
select count(*)
from old.indicateurpersonnalise oip
         join old.new_collectivites nc on nc.old_epci_id = oip.epci_id
where oip.latest; -- 125

select count(*)
from indicateur_personnalise_definition ipd

         join old.indicateur_perso_uid_mapping m
              on m.new_id = ipd.id -- 124
;

-- c. Résultats des indicateurs personnalisés
with partitioned_old_indicateur_personnalise_resultat as (
    select *, row_number() over (partition by (indicateur_id, year, epci_id) order by modified_at desc) as row_number
    from old.indicateurpersonnaliseresultat
),
     old_indicateur_personnalise_resultat as (
         select * from partitioned_old_indicateur_personnalise_resultat where row_number = 1
     )
insert
into indicateur_personnalise_resultat(indicateur_id, collectivite_id, annee, valeur, modified_at)
select mapping.new_id         indicateur_id,
       nc.new_collectivite_id collectivite_id,
       oipr.year              annee,
       oipr.value             valeur,
       -- ud.user_id modified_by,
       oipr.modified_at       modified_at
from old_indicateur_personnalise_resultat oipr
         join old.indicateur_perso_uid_mapping mapping on mapping.old_uid = oipr.indicateur_id
         join old.new_collectivites nc on oipr.epci_id = nc.old_epci_id;

select count(*)
from old.indicateurpersonnaliseresultat ipr
         join old.new_collectivites nc on nc.old_epci_id = ipr.epci_id
where ipr.latest; -- 34

select count(*)
from indicateur_personnalise_resultat ipr

         join old.indicateur_perso_uid_mapping m
              on m.new_id = ipr.indicateur_id -- 34
;

-- d. Objectifs des indicateurs personnalisés
with partitioned_old_indicateur_personnalise_objectif as (
    select *, row_number() over (partition by (indicateur_id, year, epci_id) order by modified_at desc) as row_number
    from old.indicateurpersonnaliseobjectif
),
     old_indicateur_personnalise_objectif as (
         select * from partitioned_old_indicateur_personnalise_objectif where row_number = 1
     )

insert
into indicateur_personnalise_objectif(indicateur_id, collectivite_id, annee, valeur, modified_at)
select mapping.new_id         indicateur_id,
       nc.new_collectivite_id collectivite_id,
       oipr.year              annee,
       oipr.value             valeur,
       -- ud.user_id modified_by,
       oipr.modified_at       modified_at
from old_indicateur_personnalise_objectif oipr
         join old.indicateur_perso_uid_mapping mapping on mapping.old_uid = oipr.indicateur_id
         join old.new_collectivites nc on oipr.epci_id = nc.old_epci_id;

select count(*)
from old.indicateurpersonnaliseobjectif ipr
         join old.new_collectivites nc on nc.old_epci_id = ipr.epci_id
where ipr.latest; -- 6

select count(*)
from indicateur_personnalise_objectif ipr

         join old.indicateur_perso_uid_mapping m
              on m.new_id = ipr.indicateur_id -- 6
;

-- Diagnostics
---- EPCI perdues
select oe.nom, oe.siren, '' as nature
from old.epci oe
         left join epci e on oe.siren = e.siren
where latest
  and e.siren is null
  and oe.siren != '' -- only old epci with a siren
;



-- 9 Plan action


-- 9.a Fiche action
with old_fiche as (
    select *
    from old.ficheaction
    where latest
      and not deleted
),
     new_ai as (
         select id,
                replace(
                        replace(
                                replace(
                                        jsonb_array_elements(referentiel_action_ids) :: text,
                                        '"', ''),
                                'citergie__', 'cae_'
                            ),
                        'economie_circulaire__', 'eci_'
                    ) as converted
         from old_fiche
     ),
     valid_ai as (
         select new_ai.id,
                new_ai.converted
         from new_ai
                  join action_relation on action_relation.id = new_ai.converted
     ),
     old_ir as (
         select id,
                replace(jsonb_array_elements(referentiel_indicateur_ids) :: text, '"',
                        '')::varchar(36) as old_indicateur_id
         from old_fiche
     ),
     new_ir as (
         select id,
                new_id
         from old_ir
                  join old.new_indicateur_id
                       on old_id = old_ir.old_indicateur_id
     ),
     old_ip as (
         select id,
                split_part(
                        replace(jsonb_array_elements(indicateur_personnalise_ids) :: text, '"', ''),
                        '/',
                        2
                    )::varchar(36)
                    as old_indicateur_perso_id
         from old_fiche
     ),
     new_ip as (
         select old_ip.id,
                m.new_id
         from old_ip
                  join old.indicateur_perso_uid_mapping m on m.old_uid = old_ip.old_indicateur_perso_id
                  join indicateur_personnalise_definition i on m.new_id = i.id
     )
insert
into fiche_action (modified_at,
                   uid,
                   collectivite_id,
                   avancement,
                   numerotation,
                   titre,
                   description,
                   structure_pilote,
                   personne_referente,
                   elu_referent,
                   partenaires,
                   budget_global,
                   commentaire,
                   date_fin,
                   date_debut,
                   en_retard,
                   action_ids,
                   indicateur_ids,
                   indicateur_personnalise_ids)
select modified_at,
       uid::uuid,
       nc.new_collectivite_id              collectivite_id,
       case
           when avancement like 'fait%' then 'fait'
           when avancement = 'en_cours' then 'en_cours'
           else 'pas_fait'
           end::fiche_action_avancement as avancement,
       custom_id                        as numerotation,
       titre,
       description,
       structure_pilote,
       personne_referente,
       elu_referent,
       partenaires,
       budget                           as budget_global,
       commentaire,
       date_fin,
       date_debut,
       en_retard,
       coalesce(a.id, '{}')             as action_ids,
       coalesce(ir.id, '{}')            as indicateur_ids,
       coalesce(ip.id, '{}')            as indicateur_personnalise_ids

from old_fiche
         join lateral (select array_agg(converted) as id from valid_ai where old_fiche.id = valid_ai.id) a on true
         join lateral (select array_agg(distinct new_id) as id from new_ip where old_fiche.id = new_ip.id) ip on true
         join lateral (select array_agg(new_id) as id from new_ir where old_fiche.id = new_ir.id) ir on true
         join old.new_collectivites nc on old_fiche.epci_id = nc.old_epci_id
;

select count(*)
from old.ficheaction fa
         join old.new_collectivites nc on nc.old_epci_id = fa.epci_id
where fa.latest; -- 656

select count(*)
from fiche_action fa -- 655
;

--- 9.b Plan action
truncate plan_action;

insert into plan_action (uid, collectivite_id, nom, categories, fiches_by_category, created_at, modified_at)
select gen_random_uuid()      as uuid,
       nc.new_collectivite_id as collectivite_id,
       nom,
       categories,
       fiches_by_category,
       created_at,
       modified_at
from old.planaction pa
         join old.new_collectivites nc on pa.epci_id = nc.old_epci_id
where latest
  and not deleted
;

select count(*)
from old.planaction pa
         join old.new_collectivites nc on nc.old_epci_id = pa.epci_id
where pa.latest; -- 317


select count(*)
from collectivite c
where id not in (
    select distinct collectivite_id
    from plan_action
); -- 5159

-- Create default plans
with without_plan as (
    select *
    from collectivite c
    where id not in (
        select distinct collectivite_id
        from plan_action
    )
)
insert
into plan_action
(collectivite_id,
 uid,
 nom,
 categories,
 fiches_by_category)
select id,
       gen_random_uuid(),
       'Plan d''action de la collectivité',
       '[]',
       '[]'
from without_plan;
