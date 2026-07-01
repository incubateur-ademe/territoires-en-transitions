begin;
select plan(2);

-- Un super-admin : mode support activé, aucun droit sur la collectivité 1.
do $$
declare
    super_admin_id uuid := '11111111-1111-1111-1111-111111111111';
begin
    perform test_create_user(super_admin_id, 'Sudo', 'Admin', 'sudo.admin@example.com');
    update utilisateur_support
        set is_support_mode_enabled = true
        where user_id = super_admin_id;
end
$$;

-- Un utilisateur vérifié lambda, sans droit ni mode support (contrôle négatif).
do $$
declare
    outsider_id uuid := '22222222-2222-2222-2222-222222222222';
begin
    perform test_create_user(outsider_id, 'Lambda', 'Verifie', 'lambda.verifie@example.com');
end
$$;


-- En tant que super-admin (mode support activé)
select test.identify_as('sudo.admin@example.com');

select ok(
       is_bucket_writer((select cb.bucket_id
                         from collectivite_bucket cb
                         where cb.collectivite_id = 1)),
       'Un super-admin peut écrire dans le bucket d''une collectivité où il n''a aucun droit (1)'
   );


-- En tant qu'utilisateur vérifié sans droit ni mode support
select test.identify_as('lambda.verifie@example.com');

select ok(
       not is_bucket_writer((select cb.bucket_id
                             from collectivite_bucket cb
                             where cb.collectivite_id = 1)),
       'Un utilisateur vérifié sans droit ni mode support ne peut PAS écrire dans le bucket (1)'
   );

rollback;
