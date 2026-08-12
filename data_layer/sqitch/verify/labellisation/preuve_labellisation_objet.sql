-- Verify tet:labellisation/preuve_labellisation_objet on pg

BEGIN;

select
  objet
from public.preuve_labellisation
where false;

ROLLBACK;
