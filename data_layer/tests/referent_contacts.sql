begin;
select plan(2);

-- make uid work as if yolododo user is connected
create or replace function auth.uid() returns uuid as
$$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

-- check that yaladada is included whithin the referents of collectivite #3
select results_eq(
               'select email from referent_contacts(3);',
               'select email from dcp where user_id = ''4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'';',
               'email of referent 1 should be the same as yaladada'
           );

-- when the collectivite has no referent yet 
select is_empty(
               'select * from referent_contacts(10)',
               'no referent contacts'
           );
rollback;
