-- Deploy tet:stats/geojson to pg

BEGIN;

create table stats.region_geojson
(
    insee   text unique primary key,
    libelle text,
    geojson jsonb
);

create table stats.departement_geojson
(
    insee   text unique primary key,
    libelle text,
    geojson jsonb
);

create table stats.commune_geojson
(
    insee   text unique primary key,
    libelle text,
    geojson jsonb
);

create table stats.epci_geojson
(
    siren            text unique primary key,
    raison_sociale   text,
    nature_juridique text,
    geojson          jsonb
);

create view stats.collectivite_geojson
    (siren_insee, geojson)
as
select siren, geojson
from stats.epci_geojson
union all
select insee, geojson
from stats.commune_geojson;

COMMIT;
