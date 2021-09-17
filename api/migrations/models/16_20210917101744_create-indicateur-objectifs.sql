-- upgrade --
CREATE TABLE IF NOT EXISTS "indicateurpersonnaliseobjectif" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "indicateur_id" VARCHAR(36) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "year" INT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOL NOT NULL
);
CREATE TABLE IF NOT EXISTS "indicateurobjectif" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "indicateur_id" VARCHAR(36) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "year" INT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOL NOT NULL
);
-- downgrade --
DROP TABLE IF EXISTS "indicateurpersonnaliseobjectif";
DROP TABLE IF EXISTS "indicateurobjectif";