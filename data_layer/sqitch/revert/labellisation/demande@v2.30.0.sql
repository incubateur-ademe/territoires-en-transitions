-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

drop trigger modified_at on labellisation.demande;
alter table labellisation.demande drop column modified_at;
drop trigger envoyee_le on labellisation.demande;
drop function labellisation.update_demande_envoyee_le();
alter table labellisation.demande drop column envoyee_le;

COMMIT;
