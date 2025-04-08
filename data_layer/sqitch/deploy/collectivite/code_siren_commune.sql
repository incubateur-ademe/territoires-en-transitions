-- Deploy tet:collectivite/code_siren_commune to pg

BEGIN;

-- pour importer les codes SIREN des communes
-- Ref: https://www.data.gouv.fr/fr/datasets/table-de-correspondance-entre-ndeg-siren-et-code-insee-des-communes/
create table imports.code_siren_commune
(
    siren            siren primary key,
    insee            varchar(5)   not null,
    libelle          varchar(300) not null
);

-- insère le code dans la table collectivité (à lancer manuellement apràs avoir importé le csv)
update collectivite
set siren = ic.siren
from (select * from imports.code_siren_commune) as ic
where type = 'commune'
and (commune_code = ic.insee or commune_code = ('0' || ic.insee));

COMMIT;
