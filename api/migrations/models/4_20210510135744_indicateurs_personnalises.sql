-- upgrade --
ALTER TABLE "ficheaction" ADD "indicateur_personnalise_ids" JSONB NOT NULL DEFAULT '[]';
-- downgrade --
ALTER TABLE "ficheaction" DROP COLUMN "indicateur_personnalise_ids";
