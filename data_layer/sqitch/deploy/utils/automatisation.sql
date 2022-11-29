-- Deploy tet:utils/automatisation to pg

BEGIN;

-- Vue d'un utilisateur pour un crm
create view users_crm as
select p.prenom                              as prenom,
       p.nom                                 as nom,
       p.email                               as email,
       p.telephone                           as telephone,
       u.created_at                          as creation,
       u.last_sign_in_at                     as derniere_connexion
from dcp p
         join auth.users u on u.id = p.user_id;

-- Envoie l'utilisateur modifié à n8n
create or replace function send_users_json_n8n() returns trigger as $$
declare
    to_send jsonb;
begin
    to_send = to_jsonb((select jsonb_build_array(u.*)
                        from users_crm u
                        where u.email = new.email));
    perform http_post(
            'https://territoires.app.n8n.cloud/webhook/7727c971-f11b-4f16-9a65-06e4c77e05b4',
            to_send::varchar,
            'application/json'::varchar
        );
    return new;
end;
$$ language plpgsql security definer;
comment on function send_users_json_n8n is
    'Envoie le json de l''enregistrement dcp upsert à n8n';

-- Trigger sur la table dcp
create trigger dcp_upsert
    after insert or update
    on dcp
    for each row
execute procedure send_users_json_n8n();

COMMIT;
