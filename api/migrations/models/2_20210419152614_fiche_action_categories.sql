-- upgrade --
CREATE TABLE IF NOT EXISTS "ficheactioncategorie" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "uid" VARCHAR(36) NOT NULL,
    "parent_uid" VARCHAR(36) NOT NULL,
    "nom" VARCHAR(300) NOT NULL,
    "fiche_actions_uids" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
-- downgrade --
DROP TABLE IF EXISTS "ficheactioncategorie";
