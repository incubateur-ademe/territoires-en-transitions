-- Revert tet:utilisateur/niveaux_acces from pg

BEGIN;

alter table private_utilisateur_droit
    add role_name role_name not null default 'aucun';

-- restaure les droits de façon approximative, l'information étant perdue.
update private_utilisateur_droit
set role_name =
        case
            when niveau_acces = 'admin' then 'referent'
            when niveau_acces = 'edition' then 'agent'
            when niveau_acces = 'lecture' then 'auditeur'
            end::role_name
where active;

alter table private_utilisateur_droit
    drop column niveau_acces;


create view owned_collectivite
as
with current_droits as (select *
                        from private_utilisateur_droit
                        where user_id = auth.uid()
                          and active)
select named_collectivite.collectivite_id as collectivite_id, named_collectivite.nom, role_name
from current_droits
         join named_collectivite on named_collectivite.collectivite_id = current_droits.collectivite_id
order by nom;


create view elses_collectivite
as
select active_collectivite.collectivite_id, active_collectivite.nom
from active_collectivite
         full outer join owned_collectivite on
        owned_collectivite.collectivite_id = active_collectivite.collectivite_id
where auth.uid() is null -- return all active collectivités if auth.user is null
   or owned_collectivite.collectivite_id is null;
comment on view elses_collectivite is 'Collectivités not belonging to the authenticated user';


create view retool_user_list
as
select d.id               as droit_id,
       nc.collectivite_id as collectivite_id,
       d.user_id          as user_id,
       nc.nom             as collectivite,
       d.role_name        as role,
       d.active           as active,
       p.nom              as nom,
       p.prenom           as prenom,
       p.email            as email
from private_utilisateur_droit d
         join dcp p on p.user_id = d.user_id
         join named_collectivite nc on d.collectivite_id = nc.collectivite_id
where is_service_role() -- Protect the DCPs.
;

COMMIT;
