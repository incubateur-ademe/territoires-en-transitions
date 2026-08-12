-- Revert tet:labellisation/preuve_labellisation_objet from pg

BEGIN;

alter table public.preuve_labellisation
    drop column objet;

-- `test.preuve_labellisation` est la sauvegarde que le seed de test cree par
-- `create table as select` (data_layer/seed/test/06-preuves.sql) : elle herite
-- donc du type et le retient. Absente hors environnement de test.
alter table if exists test.preuve_labellisation
    drop column if exists objet;

drop type labellisation.objet_preuve;

COMMIT;
