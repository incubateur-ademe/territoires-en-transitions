-- upgrade --
ALTER TABLE "utilisateur" DROP COLUMN "latest";
CREATE TABLE IF NOT EXISTS "utilisateurconnecte" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "ademe_user_id" VARCHAR(300) NOT NULL,
    "access_token" VARCHAR(300) NOT NULL,
    "refresh_token" VARCHAR(300) NOT NULL,
    "email" VARCHAR(300) NOT NULL,
    "nom" VARCHAR(300) NOT NULL,
    "prenom" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);-- downgrade --
ALTER TABLE "utilisateur" ADD "latest" BOOL NOT NULL;
DROP TABLE IF EXISTS "utilisateurconnecte";
