-- Deploy tet:collectivite/nic to pg

BEGIN;

-- ajoute une colonne pour sauvegarder le NIC (numéro interne de classement) du
-- siège de la collectivité, associé au SIREN (permet de déterminer le SIRET qui
-- est la concaténation du SIREN et du NIC)
-- Ref: https://www.insee.fr/fr/metadonnees/definition/c1981
alter table collectivite
  add column nic varchar(5);

COMMIT;
