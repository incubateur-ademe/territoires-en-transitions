-- Complète les epci
update collectivite
set departement_code = i.departement_code,
    region_code      = i.region_code,
    population       = i.population
from (select * from imports.banatic) as i
where collectivite.siren = i.siren;

-- Complète les communes
update collectivite
set departement_code = i.departement_code,
    region_code      = i.region_code,
    population       = i.population
from (select * from imports.commune) as i
where collectivite.commune_code = i.code;

-- Ajoute les régions
insert into collectivite (nom, type, region_code, population)
select i.libelle, 'region', i.code, i.population
from imports.region i
where i.code not in (select region_code from collectivite where type = 'region');

-- Ajoute les départements
insert into collectivite (nom, type, departement_code, region_code, population)
select i.libelle, 'departement', i.code, i.region_code, i.population
from imports.departement i
where i.code not in (select departement_code from collectivite where type = 'departement');
