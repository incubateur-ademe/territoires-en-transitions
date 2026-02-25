-- Revert tet:utilisateur/test_create_user_sync_dcp from pg

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
    insert into auth.users
    values ('00000000-0000-0000-0000-000000000000',
            test_create_user.user_id,
            'authenticated',
            'authenticated',
            test_create_user.email,
            '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C',
            now(), null, '', null, '', null, '', '', null, now(),
            '{"provider": "email", "providers": ["email"]}', '{}',
            false, now(), now(), null, null, '', '', null, default, 0);

    insert into dcp (user_id, nom, prenom, email)
    values (test_create_user.user_id, test_create_user.nom, test_create_user.prenom, test_create_user.email);
    update utilisateur_verifie set verifie = true where utilisateur_verifie.user_id = test_create_user.user_id;
end;
$$;

comment on function public.test_create_user(uuid, text, text, text) is
    'Crée un nouvel utilisateur, ajoute ses DCPs. Son mot de passe sera `yolododo.`';

COMMIT;
