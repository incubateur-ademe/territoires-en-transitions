-- Deploy tet:collectivites to pg

BEGIN;

DROP FUNCTION public.collectivite_service_tag(public.collectivite);
DROP FUNCTION public.collectivite_structure_tag(public.collectivite);
DROP FUNCTION public.collectivite_personne_tag(public.collectivite);
DROP FUNCTION public.collectivite_utilisateur(public.collectivite);
DROP FUNCTION public.collectivite_axe(public.collectivite);

COMMIT;
