create extension if not exists pgtap with schema extensions;

begin;
select plan(2);

-- make uid work as if yolododo user is connected
create or replace function auth.uid() returns uuid as
$$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

select ialike(
    (claim_collectivite(10) -> 'message')::text,
    '%Vous êtes référent%',
    'should return the success message first time'
);

select ialike(
    (claim_collectivite(10) -> 'message')::text,
    '%La collectivité dispose déjà d''un référent%',
    'should return the failure message the second time'
);
rollback;
