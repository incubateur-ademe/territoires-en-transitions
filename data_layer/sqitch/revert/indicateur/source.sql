-- Deploy tet:indicateur/source to pg

BEGIN;

alter table indicateur_resultat_import
    drop constraint indicateur_resultat_import_pkey;

-- Supprime les doublons en gardant le dernier import pour remettre la clause d'unicité sans le source_id
with indi as (select collectivite_id, indicateur_id, annee, max(modified_at) dernier_ajout, count(*) as nb_indicateur
              from indicateur_resultat_import
              group by collectivite_id, indicateur_id, annee
              having count(*) > 1)
delete
from indicateur_resultat_import iri
    using indi
where iri.indicateur_id = indi.indicateur_id
  and iri.collectivite_id = indi.collectivite_id
  and iri.annee = indi.annee
  and iri.modified_at <> indi.dernier_ajout;

alter table indicateur_resultat_import
    add constraint indicateur_resultat_import_collectivite_id_indicateur_id_an_key
        unique (collectivite_id, indicateur_id, annee);

COMMIT;
