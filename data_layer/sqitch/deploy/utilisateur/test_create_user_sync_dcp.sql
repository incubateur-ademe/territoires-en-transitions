-- Deploy tet:utilisateur/test_create_user_sync_dcp to pg
-- Adapte test_create_user : le trigger sync_dcp crée dcp à l'insert auth.users,
-- on supprime l'insert manuel et on ajoute raw_user_meta_data pour que le trigger
-- peuple correctement nom et prenom.

BEGIN;

create or replace function public.test_create_user(
    user_id uuid,
    prenom text,
    nom text,
    email text
)
returns void
language plpgsql
security definer
as
$$
begin
    insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
        phone_change, phone_change_token, phone_change_sent_at,
        email_change_token_current, email_change_confirm_status, banned_until,
        reauthentication_token, reauthentication_sent_at
    )
    values (
        '00000000-0000-0000-0000-000000000000',
        test_create_user.user_id,
        'authenticated',
        'authenticated',
        test_create_user.email,
        '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C',
        now(), null, '', null, '', null, '', '', null, now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('nom', test_create_user.nom, 'prenom', test_create_user.prenom),
        false, now(), now(), null, null, '', '', null, default, 0
    );

    -- dcp est créé par le trigger sync_dcp sur auth.users

    update utilisateur_verifie set verifie = true where utilisateur_verifie.user_id = test_create_user.user_id;
end;
$$;

comment on function public.test_create_user(uuid, text, text, text) is
    'Crée un nouvel utilisateur. Le trigger sync_dcp crée la ligne dcp. Son mot de passe sera `yolododo.`';

COMMIT;
