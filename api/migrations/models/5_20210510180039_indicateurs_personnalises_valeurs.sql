-- upgrade --
CREATE TABLE IF NOT EXISTS "indicateurpersonnalise" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "uid" VARCHAR(36) NOT NULL,
    "custom_id" VARCHAR(36) NOT NULL,
    "nom" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "unite" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);;
CREATE TABLE IF NOT EXISTS "indicateurpersonnalisevalue" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "indicateur_id" VARCHAR(136) NOT NULL,
    "value" VARCHAR(36) NOT NULL,
    "year" INT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);;
-- downgrade --
DROP TABLE IF EXISTS "indicateurpersonnalise";
DROP TABLE IF EXISTS "indicateurpersonnalisevalue";
