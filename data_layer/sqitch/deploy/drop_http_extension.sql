-- Deploy tet:drop_http_extension to pg
-- requires: http_extension

BEGIN;

-- http, absente de PostgreSQL standard, n'a plus d'appelant depuis
-- evaluation/score_service@v1.15.0 (passage à pg_net, lui-même retiré).
-- if exists : l'extension a déjà été retirée à la main en prod.
--
-- http_extension reste dans le plan : l'en retirer changerait l'ID de toutes
-- les changes suivantes (l'ID inclut celui du parent) et sqitch ne
-- reconnaîtrait plus les bases déjà déployées.
drop extension if exists http;

COMMIT;
