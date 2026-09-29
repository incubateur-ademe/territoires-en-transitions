-- Verify tet:collectivite/typologie_sinoe on pg

BEGIN;

select id, code_sinoe, libelle
from typologie_sinoe
limit 0;

select sinoe_id
from collectivite
limit 0;

ROLLBACK;
