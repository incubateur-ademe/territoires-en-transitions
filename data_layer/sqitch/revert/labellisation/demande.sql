-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

update labellisation.demande
set sujet = 'cot'::labellisation.sujet_demande
where en_cours;

alter table labellisation.demande
    add constraint demande_collectivite_id_referentiel_etoiles_key
    unique(collectivite_id, referentiel, etoiles);

alter table labellisation.demande
    alter column sujet
        set default 'cot'::labellisation.sujet_demande;

alter table labellisation.demande
alter column sujet
set not null;

COMMIT;
