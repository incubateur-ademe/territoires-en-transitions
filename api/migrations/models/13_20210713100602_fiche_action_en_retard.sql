-- upgrade --
ALTER TABLE "ficheaction" ADD "en_retard" BOOL NOT NULL DEFAULT FALSE;
-- downgrade --
ALTER TABLE "ficheaction" DROP COLUMN "en_retard";
