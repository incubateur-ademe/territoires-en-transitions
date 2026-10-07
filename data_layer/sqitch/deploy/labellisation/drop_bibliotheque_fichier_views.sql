-- Deploy tet:labellisation/drop_bibliotheque_fichier_views to pg
-- requires: labellisation/preuve_v2
-- requires: labellisation/audit

BEGIN;

drop view public.retool_preuves;
drop view public.preuve;
drop view public.bibliotheque_annexe;
drop view labellisation.bibliotheque_fichier_snippet;
drop view public.bibliotheque_fichier;

COMMIT;
