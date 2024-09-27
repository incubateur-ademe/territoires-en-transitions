-- Verify tet:taxonomie/thematique on pg

BEGIN;

SELECT 1/COUNT(*) FROM thematique WHERE md_id = 'agriculture_alimentation';

ROLLBACK;
