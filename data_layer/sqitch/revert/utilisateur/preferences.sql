-- Revert tet:utilisateur/preferences from pg

BEGIN;

-- supprime la dépendance de collectivite_utilisateur sur la colonne preferences
DROP FUNCTION public.collectivite_utilisateur(public.collectivite);

alter table dcp
  drop column preferences;

-- recrée la fonction (définie dans collectivite/collectivite@v4.37.0)
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
