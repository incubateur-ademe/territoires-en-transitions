-- Deploy tet:drop_pg_jsonschema to pg
-- requires: json_schema
-- requires: panier_action_impact/action_impact

BEGIN;

-- La forme des liens [{label, url}] relève désormais de la validation backend :
-- ces contraintes CHECK étaient les derniers utilisateurs de pg_jsonschema,
-- extension absente de PostgreSQL standard.
alter table action_impact
    drop constraint action_impact_subventions_mobilisables_check,
    drop constraint action_impact_ressources_externes_check,
    drop constraint action_impact_rex_check;

drop extension pg_jsonschema;

COMMIT;
