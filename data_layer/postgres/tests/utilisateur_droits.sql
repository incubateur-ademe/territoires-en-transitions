-- insert a fake user
insert into auth.users (id) VALUES ('66660546-f389-4d4f-bfdb-b0c94a1bd0f9');

-- insert a fake epci
insert into epci(nom, siren, nature) values ('Yolo', '666042935', 'CA');

-- make uid work as if fake user is connected
create or replace function auth.uid() returns uuid as $$
select '66660546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;


-- fixme string comparison broken 😭
-- should return the success message first time
select (claim_epci('666042935') -> 'message')::text = 'Vous avez rejoint la collectivité.';

-- should return the failure message the second time as the epci have been claimed
select (claim_epci('666042935') -> 'message')::text like 'La collectivité dispose déjà d''un référent.';
