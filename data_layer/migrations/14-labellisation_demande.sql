alter table public.labellisation_demande
    set schema labellisation;
alter table labellisation.labellisation_demande
    rename to demande;

-- remove duplicates.
delete
from labellisation.demande d1
    using labellisation.demande d2
where d1.id < d2.id
  and d1.collectivite_id = d2.collectivite_id
  and d1.referentiel = d2.referentiel
  and d1.etoiles = d2.etoiles
  and d1.en_cours
  and d1.id not in (select demande_id from labellisation_preuve_fichier);


-- ⚠️ some manual work might be necessary if some demandes with attached files where duplicated.
alter table labellisation.demande
    add constraint labellisation_collectivite_id_referentiel_etoiles_key
        unique (collectivite_id, referentiel, etoiles);


-- then execute
--- 33a-demande_labellisation.sql
