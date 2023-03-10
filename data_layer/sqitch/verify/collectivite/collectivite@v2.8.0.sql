-- Verify tet:collectivites on pg

BEGIN;

-- Fails if storage migration was not ran.
select path_tokens
from storage.objects
where false;

-- Fails if collectivités was not ran.
select has_function_privilege('unaccent(text)', 'execute');

select id, created_at, modified_at
from collectivite where false;

select id, collectivite_id, nom, siren, nature
from epci where false;

select id, collectivite_id, nom, code
from commune where false;

select id, collectivite_id, nom
from collectivite_test where false;

select collectivite_id, nom
from named_collectivite where false;

select has_function_privilege('before_write_create_collectivite()', 'execute');

ROLLBACK;
