-- Revert tet:utilisateur/droits_v2 from pg

BEGIN;

drop function if exists test_attach_user;
drop function if exists test_add_random_user;
drop table if exists test.private_utilisateur_droit;
drop table if exists test.invitation;

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

-- restaure les anciennes fonctions
create or replace function
    is_bucket_writer(id text)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
where is_any_role_on(cb.collectivite_id)
  and cb.bucket_id = is_bucket_writer.id
$$ language sql;
comment on function is_bucket_writer is
    'Returns true if current user can write on a bucket id';



create or replace function
    is_amongst_role_on(role_list role_name[], id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_amongst_role_on.id
  and role_name = any (is_amongst_role_on.role_list)
  and private_utilisateur_droit.user_id = auth.uid()
  and active
$$ language sql;

create or replace function
    is_role_on(role role_name, id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_role_on.id
  and private_utilisateur_droit.user_id = auth.uid()
  and role_name = is_role_on.role
  and active
$$ language sql;

create or replace function
    is_any_role_on(id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_any_role_on.id
  and private_utilisateur_droit.user_id = auth.uid()
  and active
$$ language sql;

create or replace function
    is_referent_of(id integer)
    returns boolean
as
$$
select is_role_on('referent', is_referent_of.id)
$$ language sql;



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


-- update RLS
alter policy allow_insert
    on reponse_choix
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on reponse_choix
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on reponse_binaire
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on reponse_binaire
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on reponse_proportion
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on reponse_proportion
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_definition
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_definition
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_resultat
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_resultat
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_objectif
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_objectif
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_resultat
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_resultat
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_objectif
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_objectif
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_commentaire
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_commentaire
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on fiche_action
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on fiche_action
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on plan_action
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on plan_action
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on action_commentaire
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on action_commentaire
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on action_statut
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on action_statut
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on preuve_lien
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on preuve_lien
    using (is_any_role_on(collectivite_id));

alter policy allow_delete
    on preuve_lien
    using (is_any_role_on(collectivite_id));

alter policy allow_read
    on private_collectivite_invitation
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on private_collectivite_invitation
    with check (is_any_role_on(collectivite_id));


-- Drop niveau d'accès
drop function have_lecture_acces(id integer);
drop function have_edition_acces(id integer);
drop function have_admin_acces(id integer);
drop function have_one_of_niveaux_acces(niveaux niveau_acces[], id integer);

alter table private_utilisateur_droit
    drop column niveau_acces;


drop type niveau_acces;

-- Restaure les anciennes vues.
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

COMMIT;
