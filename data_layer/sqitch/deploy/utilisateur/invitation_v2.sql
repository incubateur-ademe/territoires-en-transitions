-- Deploy tet:utilisateur/invitation_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

comment on function consume_invitation(id uuid) is 'Deprecated, à remplacer par l''appel trpc invitations.consume';
comment on function add_user(collectivite_id integer, email text, niveau niveau_acces) is 'Deprecated, à remplacer par l''appel trpc invitations.create';
comment on function utilisateur.invite(collectivite_id integer, email text, niveau niveau_acces) is 'Deprecated';
comment on function utilisateur.associate(collectivite_id integer, user_id uuid, niveau niveau_acces, invitation_id uuid)  is 'Deprecated';

create table utilisateur.invitation_personne_tag
(
  tag_id        integer                                                  not null,
  invitation_id uuid references utilisateur.invitation on delete cascade not null,
  tag_nom       text                                                     not null,
  primary key (tag_id, invitation_id)
);
comment on column utilisateur.invitation_personne_tag.tag_id is 'Référence vers l''identifiant du tag, pas de clé étrangère car le tag sera ensuite supprimé et on veut garder la trace.';
comment on column utilisateur.invitation_personne_tag.tag_nom is 'Contenu du tag pour garder la trace une fois le tag supprimé';

alter table personne_tag
add column associated_user_id uuid references auth.users,
add column deleted boolean generated always as (associated_user_id is not null) stored;
comment on column personne_tag.deleted is 'On ne veut plus avoir accès au tag quand un utilisateur lui a été associé.';

COMMIT;
