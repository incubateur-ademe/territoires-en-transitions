-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

alter table labellisation.demande
    add modified_at timestamp with time zone;

select private.add_modified_at_trigger('labellisation', 'demande');

COMMIT;
