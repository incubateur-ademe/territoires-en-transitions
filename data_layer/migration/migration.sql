begin;

-- 1. Import missing epcis
-- insert into epci (nom, siren, nature)
-- select oe.nom, oe.siren, 'PETR'
-- from old.epci oe
--          left join epci e on oe.siren = e.siren
-- where latest
--   and e.siren is null
--   and oe.siren != '';

-- 2. Import users
create function create_user(
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
VALUES ('00000000-0000-0000-0000-000000000000', create_user.id, '', 'authenticated',
        create_user.email, '$2a$10$vBZp2SU5Rxedb1DLsaBtP.9bu3PeNDhy9dQ7ye9ikIuw66gM4gedi',
        '2021-12-03 10:17:09.205161 +00:00', null, '', null, '', null, '', '', null,
        '2021-12-03 10:17:09.209968 +00:00', '{
    "provider": "email"
  }', 'null', false, '2021-12-03 10:17:09.201674 +00:00', '2021-12-03 10:17:09.201674 +00:00', null, null, '', '', null,
        '', 0);

$$ language sql volatile;


with unique_users as (
    select email, ademe_user_id
    from old.ademeutilisateur au
    group by ademe_user_id, email
)
select *
from unique_users,
    lateral create_user(ademe_user_id::uuid, email);

-- 3 dcp
with unique_dcp as (
    select ademe_user_id, ademeutilisateur.email, nom, prenom, ademeutilisateur.created_at, modified_at
    from old.ademeutilisateur
             join auth.users u on ademe_user_id::uuid = u.id
)
insert into dcp (user_id, nom, prenom, email, created_at, modified_at)
select ademe_user_id::uuid,  nom, prenom, email, created_at, modified_at
from unique_dcp;

-- 4 droits
with unique_droits as (
    select od.ademe_user_id,
           od.epci_id as old_epci_id,
           od.created_at
    from old.utilisateurdroits od
             join auth.users u on od.ademe_user_id::uuid = u.id
    where latest and ecriture
), new_epcis as (
    select oe.uid as old_epci_id, e.id as new_id
    from epci e
             join old.epci oe on e.siren = oe.siren
    where latest
)
insert into private_utilisateur_droit (user_id, collectivite_id, role_name, active, created_at)
select d.ademe_user_id::uuid, e.new_id, 'referent', true, d.created_at
from unique_droits d
         join new_epcis e on e.old_epci_id = d.old_epci_id;


-- 5 statuts
with partitioned_old_statuts as (
    select *, row_number() over (partition by (action_id, epci_id) order by modified_at desc) as row_number
    from old.actionstatus
    where (action_id like 'citergie__%' or action_id like 'economie_circulaire__%')
),
     old_statuts as (
         select * from partitioned_old_statuts where row_number = 1
     ),

     converted_action_id as (
         select id,
                replace(replace(action_id, 'citergie__', 'cae_'), 'economie_circulaire__', 'eci_') as converted
         from old_statuts
     ),

     converted_statut as (
         select
             id,
             case
                 when avancement like 'non_concerne%' then 'non_renseigne'
                 when avancement = 'en_cours' then 'programme'
                 when avancement = 'programmee' then 'programme'
                 when avancement = 'faite' then 'fait'
                 when avancement = 'pas_faite' then 'pas_fait'
                 else 'non_renseigne'
                 end as avancement,
             avancement like 'non_concerne%' as concerne
         from old_statuts
     ),
     new_epcis as (
         select oe.uid as old_epci_id, e.id as new_id
         from epci e
                  join old.epci oe on e.siren = oe.siren
         where latest
     )
insert into action_statut (collectivite_id, action_id, avancement, concerne, modified_by,  modified_at)
select ne.new_id as collectivite_id, ca.converted as action_id, cs.avancement::avancement, cs.concerne, ud
    .user_id, os
           .modified_at
from old_statuts os
         join new_epcis ne on os.epci_id = ne.old_epci_id
         join converted_statut cs on cs.id = os.id
         join converted_action_id ca on os.id = ca.id
         join lateral (
    select * from private_utilisateur_droit ) ud on ne.new_id = ud.collectivite_id
where collectivite_id = 1 and action_id = 'eci_4.3.3.1'
on conflict do nothing ;


rollback;
