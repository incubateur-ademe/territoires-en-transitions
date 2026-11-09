-- Deploy tet:demarche/pcaet_supra_plusieurs_depots_en_cours to pg
-- requires: demarche/pcaet_collectivite_couverte

-- Un Supra peut mener plusieurs dépôts en même temps, un par groupe d'EPCI
-- couverts. L'index « une seule démarche en cours par collectivité » ne peut pas
-- l'exprimer : il ne voit pas la nature du porteur.
--
-- La règle reste entière pour les autres collectivités, et chaque EPCI n'est
-- engagé que dans une démarche en cours : le service de création les vérifie,
-- après avoir verrouillé le porteur et les EPCI cochés (`FOR NO KEY UPDATE`),
-- ce qui sérialise les créations concurrentes.

BEGIN;

DROP INDEX public.demarche_active_unique;

COMMIT;
