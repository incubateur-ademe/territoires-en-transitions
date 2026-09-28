-- Deploy tet:drop_pg_net to pg
-- requires: pg_net_extension
-- requires: stats/drop_amplitude

BEGIN;

-- stats.amplitude_send_events était le dernier appelant de net.http_post :
-- pg_net, absente de PostgreSQL standard, n'a plus d'utilisateur.
-- if exists : l'extension peut avoir été retirée à la main (comme http).
drop extension if exists pg_net;

COMMIT;
