-- Verify tet:stats/geojson on pg

BEGIN;

select siren, raison_sociale, nature_juridique, geojson
from stats.epci_geojson
where false;

select insee, libelle, geojson
from stats.commune_geojson
where false;

select insee, libelle, geojson
from stats.departement_geojson
where false;

select insee, libelle, geojson
from stats.region_geojson
where false;

select siren_insee, geojson
from stats.collectivite_geojson
where false;

ROLLBACK;
