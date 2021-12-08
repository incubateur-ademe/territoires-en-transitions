-- make uid work as if yolododo user is connected
create or replace function auth.uid() returns uuid as $$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

select * from owned_collectivite;

select * from active_collectivite;



select * from elses_collectivite;


-- fixme string comparison broken 😭
-- should return the success message first time
select (claim_collectivite(1) -> 'message')::text = 'Vous avez rejoint la collectivité.';

-- should return the failure message the second time as the epci have been claimed
select (claim_collectivite(1) -> 'message')::text like 'La collectivité dispose déjà d''un référent.';
