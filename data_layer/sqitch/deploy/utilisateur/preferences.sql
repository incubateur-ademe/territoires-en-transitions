-- Deploy tet:utilisateur/preferences to pg

BEGIN;

alter table dcp
  add column preferences jsonb;

-- recrée la fonction (définie dans collectivite/collectivite@v4.37.0)
-- pour éviter une erreur PG ("Final statement returns too few columns")
CREATE OR REPLACE FUNCTION public.collectivite_utilisateur(public.collectivite)
    RETURNS SETOF public.dcp
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.dcp
    ;
END;

COMMIT;
