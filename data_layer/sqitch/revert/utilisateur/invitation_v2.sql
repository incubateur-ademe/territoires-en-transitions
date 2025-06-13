-- Revert tet:utilisateur/invitation_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

drop table utilisateur.invitation_personne_tag;

comment on function utilisateur.associate is
  'Associe un utilisateur à une collectivité avec un niveau d''accès.';
comment on function utilisateur.invite is
  'Crée une invitation et renvoie son id.';
comment on function add_user is
  'Ajoute un utilisateur à une collectivité avec un niveau d''accès.
      Si l''utilisateur
      - est déjà associé à la collectivité renvoie une erreur 409.
      - est dans la base, renvoie un message json {"added": true}.
      - n''est pas dans la base, renvoie un message json { "invitation_id": uuid }.';
comment on function consume_invitation is
    'Permet à l''utilisateur d''utiliser une invitation pour rejoindre une collectivité.'
        ' Renvoie un code 201 en cas de succès.'
        ' L''invitation n''est plus utilisable par la suite.';

COMMIT;
