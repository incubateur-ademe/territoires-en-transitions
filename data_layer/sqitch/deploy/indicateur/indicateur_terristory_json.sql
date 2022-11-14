-- Deploy tet:indicateur/indicateur_terristory_json to pg

BEGIN;

create table indicateur_terristory_json
(
    indicateurs jsonb       not null
        check (
            jsonb_matches_schema(
                    schema :=
                        '{
                          "type": "object",
                          "properties": {
                            "type": {"type":"string"},
                            "contenu": {
                              "type":"array",
                              "items" : {
                                "type": "object",
                                "properties": {
                                    "code": {"type":"string"},
                                    "nom": {"type":"string"},
                                    "x": {"type":"number"},
                                    "y": {"type":"number"},
                                    "val": {"type":"number"},
                                    "confidentiel": {"type":"boolean"},
                                    "annee": {"type":"string"}
                                },
                                "required" : ["code", "nom", "x", "y", "val", "confidentiel", "annee"],
                                "additionalProperties": false
                              }
                            }
                          },
                          "required" : ["type", "contenu"],
                          "additionalProperties": false
                        }',
                    instance :=indicateurs
                )
            ),
    created_at  timestamptz not null default now()
);
alter table indicateur_terristory_json
    enable row level security;

create policy allow_insert
    on indicateur_terristory_json for insert
    with check(true);


COMMIT;
