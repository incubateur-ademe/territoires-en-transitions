-- upgrade --
ALTER TABLE "indicateurpersonnalise" ADD "meta" JSONB NOT NULL DEFAULT '{}';
-- downgrade --
ALTER TABLE "indicateurpersonnalise" DROP COLUMN "meta";
