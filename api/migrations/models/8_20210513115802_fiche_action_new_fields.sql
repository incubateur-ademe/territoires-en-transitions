-- upgrade --
ALTER TABLE "ficheaction" ADD "partenaires" VARCHAR(300) NOT NULL DEFAULT '';
ALTER TABLE "ficheaction" ADD "structure_pilote" VARCHAR(300) NOT NULL DEFAULT '';
ALTER TABLE "ficheaction" ADD "elu_referent" VARCHAR(300) NOT NULL DEFAULT '';
-- downgrade --
ALTER TABLE "ficheaction" DROP COLUMN "partenaires";
ALTER TABLE "ficheaction" DROP COLUMN "structure_pilote";
ALTER TABLE "ficheaction" DROP COLUMN "elu_referent";
