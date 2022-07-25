-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

-- Crée les niveaux d'accès
create type niveau_acces as enum ('admin', 'edition', 'lecture');
comment on type niveau_acces
    is 'Détermine les droits sur les données.';

alter table private_utilisateur_droit
    add niveau_acces niveau_acces not null default 'lecture';

-- Met à jour les données existantes.
update private_utilisateur_droit
set niveau_acces =
        case
            when role_name = 'referent' then 'admin'
            when role_name = 'agent' then 'edition'
            when role_name = 'conseiller' then 'edition'
            when role_name = 'auditeur' then 'lecture'
            when role_name = 'aucun' then 'lecture'
            end::niveau_acces
where active;


-- Les fonctions helper pour les RLS.
create function
    have_one_of_niveaux_acces(niveaux niveau_acces[], id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = have_one_of_niveaux_acces.id
  and private_utilisateur_droit.user_id = auth.uid()
  and niveau_acces = any (have_one_of_niveaux_acces.niveaux)
  and active
$$ language sql;
comment on function have_one_of_niveaux_acces is
    'Vrai si l''utilisateur a un des niveaux d''accès sur une collectivite donnée.';


create function
    have_admin_acces(id integer)
    returns boolean
as
$$
select have_one_of_niveaux_acces('{admin}', have_admin_acces.id)
$$ language sql;
comment on function have_admin_acces is
    'Vrai si l''utilisateur est admin de la collectivité.';


create function
    have_edition_acces(id integer)
    returns boolean
as
$$
select have_one_of_niveaux_acces('{admin, edition}', have_edition_acces.id)
$$ language sql;
comment on function have_edition_acces is
    'Vrai si l''utilisateur à accès en édition sur la collectivité.';


create function
    have_lecture_acces(id integer)
    returns boolean
as
$$
select have_one_of_niveaux_acces('{admin, edition, lecture}', have_lecture_acces.id)
$$ language sql;
comment on function have_lecture_acces is
    'Vrai si l''utilisateur à accès en lecture sur la collectivité.';


-- met à jour les fonctions
create or replace function
    is_bucket_writer(id text)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
where have_edition_acces(cb.collectivite_id)
  and cb.bucket_id = is_bucket_writer.id
$$ language sql;
comment on function is_bucket_writer is
    'Vrai si l''utilisateur peut écrire des fichiers sur un bucket.';


create or replace function referent_contacts(id integer)
    returns table
            (
                prenom text,
                nom    text,
                email  text
            )
as
$$
select p.prenom, p.nom, p.email
from private_utilisateur_droit d
         join dcp p on p.user_id = d.user_id
where d.collectivite_id = referent_contacts.id
  and d.active
  and niveau_acces = 'admin'
$$ language sql security definer;
comment on function referent_contacts is
    'Renvoie la liste des contacts admin d''une collectivité donnée.' ;

create or replace function claim_collectivite(id integer) returns json
as
$$
declare
    collectivite_already_claimed bool;
    claimed_collectivite_id      integer;
begin
    select id into claimed_collectivite_id;

    -- compute collectivite_already_claimed, which is true if a droit exist for claimed collectivite
    select claimed_collectivite_id in (select collectivite_id
                                       from private_utilisateur_droit
                                       where active)
    into collectivite_already_claimed;

    if not collectivite_already_claimed
    then
        -- current user can claim collectivite as its own
        -- create a droit for current user on collectivite
        insert
        into private_utilisateur_droit(user_id, collectivite_id, niveau_acces, active)
        values (auth.uid(), claimed_collectivite_id, 'admin', true);
        -- return a success message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes administrateur de la collectivité.');
    else
        -- current user cannot claim the collectivite
        -- return an error with a reason
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un administrateur.');
    end if;
end
$$ language plpgsql security definer;
comment on function claim_collectivite is
    'Revendique une collectivité : '
        'Succède avec code 200 si la collectivité n''a pas déjà d''administrateur.'
        'Renvoie un code 409 si la collectivité à déjà un administrateur.';

-- redirige les fonctions, on évite de redéclarer les vues.
create or replace function
    is_any_role_on(id integer)
    returns boolean
as
$$
select have_lecture_acces(is_any_role_on.id)
$$ language sql;
comment on function is_any_role_on
    is 'Fonction dépréciée et remplacée par `have_lecture_acces`.';

create or replace function
    is_referent_of(id integer)
    returns boolean
as
$$
select have_admin_acces(is_referent_of.id)
$$ language sql;
comment on function is_referent_of
    is 'Fonction dépréciée et remplacée par `have_admin_acces`.';


-- Previously not enabled RLS.
alter table preuve_lien enable row level security;


-- Update RLS
alter policy allow_insert
    on reponse_choix
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on reponse_choix
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on reponse_binaire
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on reponse_binaire
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on reponse_proportion
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on reponse_proportion
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_definition
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_definition
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_resultat
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_resultat
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_objectif
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_objectif
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on indicateur_resultat
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on indicateur_resultat
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on indicateur_objectif
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on indicateur_objectif
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on indicateur_commentaire
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on indicateur_commentaire
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on fiche_action
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on fiche_action
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on plan_action
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on plan_action
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on action_commentaire
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on action_commentaire
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on action_statut
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on action_statut
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on preuve_lien
    with check (have_edition_acces(collectivite_id));

alter policy allow_update
    on preuve_lien
    using (have_edition_acces(collectivite_id));

alter policy allow_delete
    on preuve_lien
    using (have_edition_acces(collectivite_id));

alter policy allow_read
    on private_collectivite_invitation
    using (have_edition_acces(collectivite_id));

alter policy allow_insert
    on private_collectivite_invitation
    with check (have_admin_acces(collectivite_id));


-- Drop deprecated functions and views
drop function is_role_on;
drop function is_amongst_role_on;

drop view elses_collectivite;
drop view owned_collectivite;
drop view retool_user_list;


-- Drop the old role_name.
alter table private_utilisateur_droit
    drop column role_name;

COMMIT;
