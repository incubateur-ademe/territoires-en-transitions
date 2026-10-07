-- Revert tet:collectivite/perimetre_secondaire from pg

-- La table s'en va, mais le repli ne se défait pas : la seconde ligne
-- `collectivite` de la DR ADEME Océan Indien a été supprimée, et la ressusciter
-- lui rendrait un `id` neuf sans rien rattacher. Un revert rend donc une base
-- où le service ne couvre plus que sa région principale — état correct, moins
-- complet. Le rejeu du change le rétablit.

BEGIN;

DROP TABLE IF EXISTS public.collectivite_perimetre_secondaire;

COMMIT;
