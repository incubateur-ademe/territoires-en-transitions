-- upgrade --
CREATE TABLE IF NOT EXISTS "indicateurreferentielcommentaire" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "indicateur_id" VARCHAR(136) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
-- downgrade --
DROP TABLE IF EXISTS "indicateurreferentielcommentaire";
