-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

drop trigger modified_at on labellisation.demande;
alter table labellisation.demande drop column modified_at;

COMMIT;
