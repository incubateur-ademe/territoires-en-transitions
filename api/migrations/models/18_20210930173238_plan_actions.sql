-- upgrade --
create extension if not exists "uuid-ossp";

CREATE TABLE IF NOT EXISTS "planaction" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "uid" VARCHAR(36) NOT NULL,
    "nom" VARCHAR(300) NOT NULL,
    "categories" JSONB NOT NULL,
    "fiches_by_category" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOL NOT NULL,
    "deleted" BOOL NOT NULL
);

-- downgrade --
DROP TABLE IF EXISTS "planaction";
drop extension if exists "uuid-ossp";
