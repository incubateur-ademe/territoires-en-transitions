begin;

select plan(14);

--------------
-- Fixtures --
--------------
-- Deux utilisateurs (insert direct : le trigger sync_dcp crée les dcp).
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'e0d10000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
        'olga.identite-oidc@test.fr', '{"provider": "email", "providers": ["email"]}', '{"nom": "Oidc", "prenom": "Olga"}', now(), now()),
       ('00000000-0000-0000-0000-000000000000', 'e0d10000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
        'oscar.identite-oidc@test.fr', '{"provider": "email", "providers": ["email"]}', '{"nom": "Oidc", "prenom": "Oscar"}', now(), now());

---------------
-- Structure --
---------------
select has_table('public'::name, 'utilisateur_identite_oidc'::name,
                 'La table public.utilisateur_identite_oidc doit exister');

select col_is_pk('public', 'utilisateur_identite_oidc', array ['provider', 'sub'],
                 'La clé primaire doit être composite (provider, sub)');

select throws_ok(
               $$ insert into public.utilisateur_identite_oidc (provider, sub, user_id, email)
                  values ('autre', 'sub-hors-domaine', 'e0d10000-0000-4000-8000-000000000001', 'olga.identite-oidc@test.fr') $$,
               '23514',
               null,
               'Un provider hors de proconnect|moncompteademe doit être rejeté (CHECK)');

---------------------------
-- Insertions et unicités --
---------------------------
select lives_ok(
               $$ insert into public.utilisateur_identite_oidc (provider, sub, user_id, email, siret, idp_id, claims)
                  values ('proconnect', 'sub-initial', 'e0d10000-0000-4000-8000-000000000001', 'olga.identite-oidc@test.fr',
                          '13000548100010', 'idp-1', '{"given_name": "Olga"}'::jsonb) $$,
               'Une identité proconnect doit pouvoir être insérée');

select throws_ok(
               $$ insert into public.utilisateur_identite_oidc (provider, sub, user_id, email)
                  values ('proconnect', 'sub-doublon', 'e0d10000-0000-4000-8000-000000000001', 'olga.identite-oidc@test.fr') $$,
               '23505',
               null,
               'Un même compte ne doit pas avoir deux subs pour le même provider (UNIQUE(user_id, provider))');

select throws_ok(
               $$ insert into public.utilisateur_identite_oidc (provider, sub, user_id, email)
                  values ('proconnect', 'sub-initial', 'e0d10000-0000-4000-8000-000000000002', 'oscar.identite-oidc@test.fr') $$,
               '23505',
               null,
               'Un même (provider, sub) ne doit pas être lié à deux comptes (PK composite)');

select lives_ok(
               $$ insert into public.utilisateur_identite_oidc (provider, sub, user_id, email)
                  values ('moncompteademe', 'sub-mca', 'e0d10000-0000-4000-8000-000000000001', 'olga.identite-oidc@test.fr') $$,
               'Un même compte doit pouvoir être lié à un second provider (deux lignes, un seul compte)');

-------------------------------------------------
-- Rotation de sub par upsert (user_id, provider) --
-------------------------------------------------
select lives_ok(
               $$ insert into public.utilisateur_identite_oidc (provider, sub, user_id, email)
                  values ('proconnect', 'sub-nouveau', 'e0d10000-0000-4000-8000-000000000001', 'olga.v2@test.fr')
                  on conflict (user_id, provider)
                      do update set sub                = excluded.sub,
                                    email              = excluded.email,
                                    last_sign_in_at = now() $$,
               'L''upsert sur (user_id, provider) doit permettre la rotation de sub');

select is(
               (select sub
                from public.utilisateur_identite_oidc
                where user_id = 'e0d10000-0000-4000-8000-000000000001'
                  and provider = 'proconnect'),
               'sub-nouveau',
               'Après rotation, la dernière identité prouvée remplace l''ancienne (sub mis à jour)');

select is(
               (select count(*)
                from public.utilisateur_identite_oidc
                where user_id = 'e0d10000-0000-4000-8000-000000000001'
                  and provider = 'proconnect'),
               1::bigint,
               'La rotation ne doit pas créer de seconde ligne pour le couple (user_id, provider)');

---------------------------------
-- FK cascade sur auth.users --
---------------------------------
insert into public.utilisateur_identite_oidc (provider, sub, user_id, email)
values ('moncompteademe', 'sub-oscar', 'e0d10000-0000-4000-8000-000000000002', 'oscar.identite-oidc@test.fr');

select test_remove_user('oscar.identite-oidc@test.fr');

select is_empty(
               $$ select * from public.utilisateur_identite_oidc where user_id = 'e0d10000-0000-4000-8000-000000000002' $$,
               'La suppression du compte auth.users doit supprimer ses identités (ON DELETE CASCADE)');

----------------------------------------
-- RLS sans policy (service_role only) --
----------------------------------------
select ok((select relrowsecurity
           from pg_class c
                    join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public'
             and c.relname = 'utilisateur_identite_oidc'),
          'RLS doit être activée sur utilisateur_identite_oidc');

select is_empty(
               $$ select * from pg_policies where schemaname = 'public' and tablename = 'utilisateur_identite_oidc' $$,
               'utilisateur_identite_oidc ne doit avoir aucune policy (accès service_role uniquement)');

-- Même avec un grant explicite, un rôle authenticated ne voit rien (deny-by-default).
grant select on public.utilisateur_identite_oidc to authenticated;
set local role authenticated;

select is_empty(
               $$ select * from public.utilisateur_identite_oidc $$,
               'Un rôle authenticated ne doit voir aucune ligne (RLS sans policy)');

reset role;

rollback;
