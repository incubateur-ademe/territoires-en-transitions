-- Revert tet:referentiel from pg

BEGIN;

drop table action_computed_points;
drop table action_definition;
drop type action_categorie;

drop table indicateur_action;
drop table indicateur_definition;

drop domain indicateur_id;

drop table indicateur_parent;

drop type indicateur_group;

drop table action_relation;

drop type action_type;
drop type action_id;
drop type referentiel;

COMMIT;
