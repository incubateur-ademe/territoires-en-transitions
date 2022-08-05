-- Deploy tet:utilisateur/membre to pg

BEGIN;

create type membre_fonction as enum ('referent', 'conseiller', 'technique', 'politique', 'partenaire');
comment on type membre_fonction
    is 'Détermine la fonction d''un membre d''une collectivité';


create table private_collectivite_membre
(
    user_id            uuid references auth.users                         not null,
    collectivite_id    integer references collectivite                    not null,
    fonction           membre_fonction,
    details_fonction   text,
    champ_intervention referentiel[],
    created_at         timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at        timestamp with time zone default CURRENT_TIMESTAMP not null
);
alter table private_collectivite_membre
    add constraint private_collectivite_membre_user_collectivite
        unique (collectivite_id, user_id);

alter table private_collectivite_membre
    enable row level security;

create policy allow_read
    on private_collectivite_membre
    for select
    using (true);


create function update_collectivite_membre_details_fonction(collectivite_id integer, membre_id uuid, details_fonction text)
    returns json
as
$$
declare
    invitation_id uuid;
begin
    if have_admin_acces(update_collectivite_membre_details_fonction.collectivite_id)
        or auth.uid() = membre_id
    then
        if membre_id in (select user_id
                         from private_collectivite_membre pcm
                         where pcm.collectivite_id = update_collectivite_membre_details_fonction.collectivite_id)
        then
            update private_collectivite_membre
            set details_fonction = update_collectivite_membre_details_fonction.details_fonction
            where user_id = membre_id
              and private_collectivite_membre.collectivite_id =
                  update_collectivite_membre_details_fonction.collectivite_id;
        else
            insert into private_collectivite_membre(collectivite_id, user_id, details_fonction)
            values (update_collectivite_membre_details_fonction.collectivite_id, membre_id,
                    update_collectivite_membre_details_fonction.details_fonction);
        end if;
        return json_build_object('message', 'Le détail de la fonction du membre a été mise à jour.');
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error', 'Vous n''avez pas les droits pour modifier la fonction de ce membre.');
    end if;
end
$$ language plpgsql security definer;
comment on function update_collectivite_membre_details_fonction is
    'Met à jour le champs details_fonction d''un membre s''il est autorisé à le faire';


create function update_collectivite_membre_fonction(collectivite_id integer, membre_id uuid, fonction membre_fonction)
    returns json
as
$$
declare
    invitation_id uuid;
begin
    if have_admin_acces(update_collectivite_membre_fonction.collectivite_id)
        or auth.uid() = membre_id
    then
        if membre_id in (select user_id
                         from private_collectivite_membre pcm
                         where pcm.collectivite_id = update_collectivite_membre_fonction.collectivite_id)
        then
            update private_collectivite_membre
            set fonction = update_collectivite_membre_fonction.fonction
            where user_id = membre_id
              and private_collectivite_membre.collectivite_id = update_collectivite_membre_fonction.collectivite_id;
        else
            insert into private_collectivite_membre(collectivite_id, user_id, fonction)
            values (update_collectivite_membre_fonction.collectivite_id, membre_id,
                    update_collectivite_membre_fonction.fonction);
        end if;
        return json_build_object('message', 'La fonction du membre a été mise à jour.');
    else
        perform set_config('response.status', '403', true);
        return json_build_object('error', 'Vous n''avez pas les droits pour modifier la fonction de ce membre.');
    end if;
end
$$ language plpgsql security definer;
comment on function update_collectivite_membre_fonction is
    'Met à jour le champs fonction d''un membre s''il est autorisé à le faire';


create function update_collectivite_membre_champ_intervention(collectivite_id integer, membre_id uuid,
                                                              champ_intervention referentiel[])
    returns json
as
$$
declare
    invitation_id uuid;
begin
    if have_admin_acces(update_collectivite_membre_champ_intervention.collectivite_id)
        or auth.uid() = membre_id
    then
        if membre_id in (select user_id
                         from private_collectivite_membre pcm
                         where pcm.collectivite_id = update_collectivite_membre_champ_intervention.collectivite_id)
        then
            update private_collectivite_membre
            set champ_intervention = update_collectivite_membre_champ_intervention.champ_intervention
            where user_id = membre_id
              and private_collectivite_membre.collectivite_id =
                  update_collectivite_membre_champ_intervention.collectivite_id;
        else
            insert into private_collectivite_membre(collectivite_id, user_id, champ_intervention)
            values (update_collectivite_membre_champ_intervention.collectivite_id, membre_id,
                    update_collectivite_membre_champ_intervention.champ_intervention);
        end if;
        return json_build_object('message', 'Le champ d''intervention du membre a été mise à jour.');
    else
        perform set_config('response.status', '403', true);
        return json_build_object('error',
                                 'Vous n''avez pas les droits pour modifier le champ d''intervention de ce membre.');
    end if;
end
$$ language plpgsql security definer;
comment on function update_collectivite_membre_champ_intervention is
    'Met à jour le champ d''intervention d''un membre s''il est autorisé à le faire';


create function update_collectivite_membre_niveau_acces(collectivite_id integer, membre_id uuid, niveau_acces niveau_acces)
    returns json
as
$$
declare
    invitation_id uuid;
begin
    if have_admin_acces(update_collectivite_membre_niveau_acces.collectivite_id)
    then
        if membre_id in (select user_id
                         from private_collectivite_membre pcm
                         where pcm.collectivite_id = update_collectivite_membre_niveau_acces.collectivite_id)
        then
            update private_utilisateur_droit
            set niveau_acces = update_collectivite_membre_niveau_acces.niveau_acces,
                modified_at  = now()
            where user_id = membre_id
              and private_utilisateur_droit.collectivite_id = update_collectivite_membre_niveau_acces.collectivite_id;
        else
            return json_build_object('error', 'Cet utilisateur n''est pas membre de la collectivité.');
        end if;
        return json_build_object('message', 'Le niveau d''acces du membre a été mise à jour.');
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error',
                                 'Vous n''avez pas les droits admin, vous ne pouvez pas éditer le niveau d''acces de ce membre.');
    end if;
end
$$ language plpgsql security definer;
comment on function update_collectivite_membre_niveau_acces is
    'Met à jour le niveau d''acces d''un membre si l''utilisateur connecté est admin';


drop function remove_user_from_collectivite;
create function remove_membre_from_collectivite(collectivite_id integer, membre_id uuid)
    returns json
as
$$
begin
    if have_admin_acces(remove_membre_from_collectivite.collectivite_id)
        or auth.uid() = membre_id
    then
        if membre_id in (select user_id
                         from private_collectivite_membre pcm
                         where pcm.collectivite_id = remove_membre_from_collectivite.collectivite_id)
        then
            update private_utilisateur_droit
            set active      = false,
                modified_at = now()
            where user_id = membre_id
              and private_utilisateur_droit.collectivite_id = remove_membre_from_collectivite.collectivite_id;
        else
            return json_build_object('error', 'Cet utilisateur n''est pas membre de la collectivité.');
        end if;
        return json_build_object('message', 'Les accès de l''utilisateur ont été supprimés.');
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error',
                                 'Vous n''avez pas les droits admin, vous ne pouvez pas retirer les droits d''accès d''uu utilisateur');
    end if;
end
$$ language plpgsql security definer;
comment on function remove_membre_from_collectivite is
    'Supprime les accès d''un membre si l''utilisateur connecté est admin';


create function collectivite_membres(id integer)
    returns table
            (
                user_id            text,
                prenom             text,
                nom                text,
                email              text,
                telephone          text,
                niveau_acces       niveau_acces,
                fonction           membre_fonction,
                details_fonction   text,
                champ_intervention referentiel[]
            )
as
$$
with droits_dcp_membre as
         (select d.user_id,
                 p.prenom,
                 p.nom,
                 p.email,
                 p.telephone,
                 d.niveau_acces,
                 m.fonction,
                 m.details_fonction,
                 m.champ_intervention
          from private_utilisateur_droit d
                   left join utilisateur.dcp_display p on p.user_id = d.user_id
                   left join private_collectivite_membre m
                             on m.user_id = d.user_id and m.collectivite_id = d.collectivite_id
          where d.collectivite_id = collectivite_membres.id
            and d.active),
     invitations as (select null::uuid             as user_id,
                            null                   as prenom,
                            null                   as nom,
                            i.email,
                            null                   as telephone,
                            i.niveau::niveau_acces as niveau_acces,
                            null::membre_fonction  as fonction,
                            null                   as details_fonction,
                            null::referentiel[]    as champ_intervention
                     from utilisateur.invitation i
                     where i.collectivite_id = collectivite_membres.id),
     merged as (select *
                from droits_dcp_membre
                where have_lecture_acces(collectivite_membres.id) -- limit dcp listing.
                union
                select *
                from invitations
                where have_edition_acces(collectivite_membres.id) -- do not show invitations to those who cannot invite.
     )
select *
from merged
order by case fonction
             when 'referent' then 1
             when 'technique' then 2
             when 'politique' then 3
             when 'conseiller' then 4
             else 5
             end,
         nom,
         prenom
    ;
$$ language sql security definer;
comment on function collectivite_membres is
    'Les informations de tous les membres d''une collectivité étant donné son id.'
        'Les invités qui n''ont pas encore accepté leur invitation ont un `user_id` null.';


COMMIT;
