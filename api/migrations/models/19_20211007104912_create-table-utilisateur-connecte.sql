-- upgrade --
ALTER TABLE "utilisateur" DROP COLUMN "latest";
CREATE TABLE IF NOT EXISTS "ademeutilisateur" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "ademe_user_id" VARCHAR(300) NOT NULL,
    "email" VARCHAR(300) NOT NULL,
    "nom" VARCHAR(300) NOT NULL,
    "prenom" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- downgrade --
ALTER TABLE "utilisateur"
ADD "latest" BOOL NOT NULL DEFAULT TRUE;
DROP TABLE IF EXISTS "ademeutilisateur";