-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

alter table labellisation.demande
    alter column sujet
        drop default;

alter table labellisation.demande
    alter column sujet
        drop not null;

-- Local
alter table labellisation.demande
    drop constraint if exists demande_collectivite_id_referentiel_etoiles_key;
-- Prod
alter table labellisation.demande
    drop constraint if exists labellisation_collectivite_id_referentiel_etoiles_key;

update labellisation.demande
set sujet = null
where en_cours;

COMMIT;
