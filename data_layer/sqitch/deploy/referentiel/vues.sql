-- Deploy tet:referentiel/vues to pg

BEGIN;

drop function referentiel_down_to_action(referentiel referentiel);
drop function action_down_to_tache(referentiel referentiel, identifiant text);

drop view action_title;
drop view action_definition_summary;

COMMIT;
