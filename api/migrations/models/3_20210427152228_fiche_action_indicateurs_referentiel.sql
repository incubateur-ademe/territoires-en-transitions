-- upgrade --
ALTER TABLE "ficheaction" ADD "referentiel_indicateur_ids" JSONB NOT NULL DEFAULT '[]';
-- downgrade --
ALTER TABLE "ficheaction" DROP COLUMN "referentiel_indicateur_ids";
