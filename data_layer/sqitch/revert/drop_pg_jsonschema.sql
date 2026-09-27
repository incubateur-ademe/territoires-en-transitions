-- Revert tet:drop_pg_jsonschema from pg

BEGIN;

create extension if not exists pg_jsonschema;

alter table action_impact
    add constraint action_impact_subventions_mobilisables_check
        check (jsonb_matches_schema(
            schema := '{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {"type": "string"},
                  "url": {"type": "string"}
                },
                "required": ["label", "url"],
                "additionalProperties": false
              }
            }',
            instance := subventions_mobilisables
        )),
    add constraint action_impact_ressources_externes_check
        check (jsonb_matches_schema(
            schema := '{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {"type": "string"},
                  "url": {"type": "string"}
                },
                "required": ["label", "url"],
                "additionalProperties": false
              }
            }',
            instance := ressources_externes
        )),
    add constraint action_impact_rex_check
        check (jsonb_matches_schema(
            schema := '{
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {"type": "string"},
                  "url": {"type": "string"}
                },
                "required": ["label", "url"],
                "additionalProperties": false
              }
            }',
            instance := rex
        ));

COMMIT;
