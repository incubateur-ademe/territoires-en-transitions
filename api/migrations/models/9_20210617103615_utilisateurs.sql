-- upgrade --
CREATE TABLE IF NOT EXISTS "utilisateur" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "ademe_user_id" VARCHAR(300) NOT NULL,
    "vie_privee_conditions" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
-- downgrade --
DROP TABLE IF EXISTS "utilisateur";
