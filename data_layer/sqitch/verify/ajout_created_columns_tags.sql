-- Verify tet:ajout_created_columns_tags on pg

BEGIN;

SELECT id, nom, collectivite_id, created_by, created_at
FROM financeur_tag
WHERE false;

SELECT id, nom, collectivite_id, created_by, created_at
FROM partenaire_tag
WHERE false;

SELECT id, nom, collectivite_id, created_by, created_at
FROM service_tag
WHERE false;

SELECT id, nom, collectivite_id, created_by, created_at
FROM structure_tag
WHERE false;

SELECT id, nom, collectivite_id, created_by, created_at
FROM personne_tag
WHERE false;

ROLLBACK;

