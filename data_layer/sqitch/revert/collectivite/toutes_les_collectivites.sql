-- Deploy tet:collectivite/toutes_les_collectivites to pg
-- requires: collectivite/imports
-- requires: collectivite/collectivite
-- requires: evaluation/referentiel_progress

BEGIN;

drop function active(collectivite);
drop function collectivite_card(axe);
drop function vide(axe);

COMMIT;
