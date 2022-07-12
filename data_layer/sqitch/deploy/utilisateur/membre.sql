-- Deploy tet:utilisateur/membre to pg

BEGIN;

create type membre_fonction as enum ('referent', 'conseiller', 'technique', 'politique', 'partenaire');
comment on type membre_fonction
    is 'Détermine la fonction d''un membre d''une collectivité';


create table private_collectivite_membre
(
    user_id         uuid references auth.users                         not null,
    collectivite_id integer references collectivite                    not null,
    fonction        membre_fonction,
    details_fonction text,
    champ_intervention referentiel[],
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at     timestamp with time zone default CURRENT_TIMESTAMP not null
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

create policy allow_update
    on private_collectivite_membre
    for update
    using (is_service_role());




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
       if membre_id in (select user_id from private_collectivite_membre pcm where pcm.collectivite_id = update_collectivite_membre_details_fonction.collectivite_id)
          then 
            update  private_collectivite_membre
            set details_fonction =  update_collectivite_membre_details_fonction.details_fonction
            where user_id = membre_id and private_collectivite_membre.collectivite_id = update_collectivite_membre_details_fonction.collectivite_id; 
          else 
            insert into private_collectivite_membre(collectivite_id, user_id, details_fonction) values(update_collectivite_membre_details_fonction.collectivite_id, membre_id, update_collectivite_membre_details_fonction.details_fonction);
          end if;
        return json_build_object('message', 'La fonction du membre a été mise à jour.');
    else
        perform set_config('response.status', '401', true);
        return json_build_object('error', 'Vous n''avez pas les droits pour modifier la fonction de ce membre.');
    end if;
end
$$ language plpgsql security definer;
comment on function update_collectivite_membre_details_fonction is
    'Met à jour le champs details_fonction d''un membre s''il est autorisé à le faire';


create function collectivite_membres(id integer)
    returns table
            (
                prenom text,
                nom text, 
                email text,
                telephone text,
                niveau_acces niveau_acces,
                fonction membre_fonction,
                details_fonction text, 
                champ_intervention referentiel[]
            )
as
$$
with droits_dcp as 
(select p.user_id, p.prenom, p.nom, p.email, p.telephone, d.niveau_acces
from private_utilisateur_droit d
    left join dcp p on p.user_id = d.user_id
    
where d.collectivite_id = collectivite_membres.id
  and d.active)
select prenom, nom, email, telephone, niveau_acces , fonction, details_fonction, champ_intervention
from droits_dcp 
left join private_collectivite_membre m
on m.user_id = droits_dcp.user_id and  m.collectivite_id = collectivite_membres.id
$$ language sql security definer;
comment on function collectivite_membres is
    'Retourne les informations sur tous les membres d''une collectivité étant donné l''id.''';




COMMIT;
