-- upgrade --
CREATE TABLE IF NOT EXISTS "actionmeta" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "action_id" VARCHAR(36) NOT NULL,
    "epci_id" VARCHAR(36) NOT NULL,
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOL NOT NULL
);
-- downgrade --
DROP TABLE IF EXISTS "actionmeta";
