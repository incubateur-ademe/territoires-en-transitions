begin;
select plan(3);

-- make uid work as if yolododo user is connected
create or replace function auth.uid() returns uuid as
$$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

-- check that yolododo is referent
select results_eq(
               'select to_json(personnes[1]) ->> ''email'' as email from collectivite_user_list(1) where role_name = ''referent'';',
               'select to_json(p) ->> ''email'' as email from dcp p where user_id = ''17440546-f389-4d4f-bfdb-b0c94a1bd0f9'';',
               'email of referent 1 should be the same as yolododo'
           );

-- check that yaladada is auditeur
select results_eq(
               'select to_json(personnes[1]) ->> ''email'' as email from collectivite_user_list(1) where role_name = ''auditeur'';',
               'select to_json(p) ->> ''email'' as email from dcp p where user_id = ''4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'';',
               'email of auditeur 1 should be the same as yaladada'
           );


-- remove yalada as auditeur
select remove_user_from_collectivite(1, '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'::uuid);

select is_empty(
               'select * from collectivite_user_list(1) where role_name = ''auditeur''',
               'no auditeur should be left'
           );


rollback;
