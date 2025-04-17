-- Deploy tet:utilisateur/export_connect to pg

BEGIN;

-- ajoute une table pour enregistrer la checksum des informations associées à un
-- membre de collectivité, afin d'envoyer sur Connect que les membres pour lesquels
-- ces informations ont changées depuis le dernier export
create table utilisateur.export_connect
(
    user_id     uuid references auth.users not null primary key,
    export_id   text not null,
    checksum    text not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table utilisateur.export_connect is 'Checksum du dernier envoi d''un utilisateur vers Connect';

COMMIT;
