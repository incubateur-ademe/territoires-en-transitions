-- Revert tet:utilisateur/preferences from pg

BEGIN;

-- supprime la dépendance de collectivite_utilisateur sur la colonne preferences
DROP FUNCTION public.collectivite_utilisateur(public.collectivite);

-- supprime accepter_cgu qui dépend de la structure dcp (incluant preferences)
DROP FUNCTION IF EXISTS public.accepter_cgu();

alter table dcp
  drop column preferences;

-- recrée accepter_cgu (existait à v4.0.0, supprimée temporairement pour pouvoir drop preferences)
create function public.accepter_cgu()
    returns public.dcp
    language sql
begin atomic
    update public.dcp
    set cgu_acceptees_le = now()
    where user_id = auth.uid()
    returning *;
end;
comment on function public.accepter_cgu is 'Inscrit la date à laquelle l''utilisateur a acceptée les CGU.';

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
