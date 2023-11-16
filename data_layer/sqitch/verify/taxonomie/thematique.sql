-- Verify tet:taxonomie/thematique on pg

BEGIN;

select id, thematique_id, sous_thematique
from sous_thematique
where false;

ROLLBACK;
