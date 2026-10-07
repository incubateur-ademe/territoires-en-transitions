-- Deploy tet:labellisation/drop_add_bibliotheque_fichier to pg

BEGIN;

drop function public.add_bibliotheque_fichier(integer, varchar, text, boolean);

COMMIT;
