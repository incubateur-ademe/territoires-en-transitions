begin;

select plan(12);

--------------
-- Fixtures --
--------------
-- Deux utilisateurs (insert direct : le trigger sync_dcp crée les dcp).
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'e0d20000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
        'rita.rattachement@test.fr', '{"provider": "email", "providers": ["email"]}', '{"nom": "Rattachement", "prenom": "Rita"}', now(), now()),
       ('00000000-0000-0000-0000-000000000000', 'e0d20000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
        'remi.rattachement@test.fr', '{"provider": "email", "providers": ["email"]}', '{"nom": "Rattachement", "prenom": "Rémi"}', now(), now());

---------------
-- Structure --
---------------
select has_table('public'::name, 'utilisateur_identite_oidc_invitation'::name,
                 'La table public.utilisateur_identite_oidc_invitation doit exister');

select col_is_pk('public', 'utilisateur_identite_oidc_invitation', 'id',
                 'La clé primaire doit être id');

select col_not_null('public', 'utilisateur_identite_oidc_invitation', 'expires_at',
                    'La colonne expires_at doit être NOT NULL (expiration 24 h contrôlée applicativement)');

select throws_ok(
               $$ insert into public.utilisateur_identite_oidc_invitation (token_hash, provider, sub, claims, email_provider, initial_mail, user_id, expires_at)
                  values ('hash-provider-invalide', 'autre', 'sub-x', '{}'::jsonb, 'p@test.fr', 'a@test.fr',
                          'e0d20000-0000-4000-8000-000000000003', now() + interval '24 hours') $$,
               '23514',
               null,
               'Un provider hors de proconnect|moncompteademe doit être rejeté (CHECK)');

---------------------------
-- Insertions et unicités --
---------------------------
select lives_ok(
               $$ insert into public.utilisateur_identite_oidc_invitation (token_hash, provider, sub, claims, email_provider, initial_mail, user_id, expires_at)
                  values ('hash-1', 'proconnect', 'sub-dr-1', '{"email": "rita.pc@test.fr"}'::jsonb, 'rita.pc@test.fr', 'rita.rattachement@test.fr',
                          'e0d20000-0000-4000-8000-000000000003', now() + interval '24 hours') $$,
               'Une demande de rattachement doit pouvoir être insérée');

select throws_ok(
               $$ insert into public.utilisateur_identite_oidc_invitation (token_hash, provider, sub, claims, email_provider, initial_mail, user_id, expires_at)
                  values ('hash-1', 'proconnect', 'sub-dr-autre', '{}'::jsonb, 'p@test.fr', 'rita.rattachement@test.fr',
                          'e0d20000-0000-4000-8000-000000000003', now() + interval '24 hours') $$,
               '23505',
               null,
               'Le token_hash doit être unique');

select throws_ok(
               $$ insert into public.utilisateur_identite_oidc_invitation (token_hash, provider, sub, claims, email_provider, initial_mail, user_id, expires_at)
                  values ('hash-2', 'proconnect', 'sub-dr-1', '{}'::jsonb, 'rita.pc@test.fr', 'rita.rattachement@test.fr',
                          'e0d20000-0000-4000-8000-000000000003', now() + interval '24 hours') $$,
               '23505',
               null,
               'Une seule demande pendante par (provider, sub) (index unique partiel)');

-- Une fois la demande confirmée, une nouvelle demande pendante redevient possible.
update public.utilisateur_identite_oidc_invitation
set confirmed_at = now()
where token_hash = 'hash-1';

select lives_ok(
               $$ insert into public.utilisateur_identite_oidc_invitation (token_hash, provider, sub, claims, email_provider, initial_mail, user_id, expires_at)
                  values ('hash-3', 'proconnect', 'sub-dr-1', '{}'::jsonb, 'rita.pc@test.fr', 'rita.rattachement@test.fr',
                          'e0d20000-0000-4000-8000-000000000003', now() + interval '24 hours') $$,
               'Après confirmation, une nouvelle demande pendante pour le même (provider, sub) doit être acceptée');

---------------------------------
-- FK cascade sur auth.users --
---------------------------------
insert into public.utilisateur_identite_oidc_invitation (token_hash, provider, sub, claims, email_provider, initial_mail, user_id, expires_at)
values ('hash-remi', 'moncompteademe', 'sub-dr-remi', '{}'::jsonb, 'remi.mca@test.fr', 'remi.rattachement@test.fr',
        'e0d20000-0000-4000-8000-000000000004', now() + interval '24 hours');

select test_remove_user('remi.rattachement@test.fr');

select is_empty(
               $$ select * from public.utilisateur_identite_oidc_invitation where user_id = 'e0d20000-0000-4000-8000-000000000004' $$,
               'La suppression du compte auth.users doit supprimer ses demandes (ON DELETE CASCADE)');

----------------------------------------
-- RLS sans policy (service_role only) --
----------------------------------------
select ok((select relrowsecurity
           from pg_class c
                    join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public'
             and c.relname = 'utilisateur_identite_oidc_invitation'),
          'RLS doit être activée sur utilisateur_identite_oidc_invitation');

select is_empty(
               $$ select * from pg_policies where schemaname = 'public' and tablename = 'utilisateur_identite_oidc_invitation' $$,
               'utilisateur_identite_oidc_invitation ne doit avoir aucune policy (accès service_role uniquement)');

-- Même avec un grant explicite, un rôle authenticated ne voit rien (deny-by-default).
grant select on public.utilisateur_identite_oidc_invitation to authenticated;
set local role authenticated;

select is_empty(
               $$ select * from public.utilisateur_identite_oidc_invitation $$,
               'Un rôle authenticated ne doit voir aucune ligne (RLS sans policy)');

reset role;

rollback;
