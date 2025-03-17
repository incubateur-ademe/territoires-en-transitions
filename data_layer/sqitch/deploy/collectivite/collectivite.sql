-- Deploy tet:plan_action/fiches to pg

BEGIN;

alter table collectivite
  add column dans_aire_urbaine boolean;

-- pour importer le statut d'unité urbaine de la commune
-- source : https://www.insee.fr/fr/information/4802589
create table imports.unite_urbaine
(
    code             codegeo primary key,
    statut_com_uu    varchar(1)  not null
);

-- insère le statut dans la table collectivité (à lancer manuellement apràs avoir importé le csv)
update collectivite
set dans_aire_urbaine = (
  case
    when i.statut_com_uu = 'C' then true
    when i.statut_com_uu = 'B' then true
    when i.statut_com_uu = 'I' then true
    when i.statut_com_uu = 'H' then false
    else null
  end
)
from (select * from imports.unite_urbaine) as i
where collectivite.commune_code = i.code;

COMMIT;
