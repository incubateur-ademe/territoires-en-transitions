create or replace function auth.uid() returns uuid as $$
select '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid;
$$ language sql stable;

select *
from epci
where siren = '123456789';

select claim_epci('123456789');

select * from private_utilisateur_droit;

select * from client_owned_epci;
