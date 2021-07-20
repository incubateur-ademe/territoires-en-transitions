-- upgrade --
ALTER TABLE "ficheaction" RENAME COLUMN "porteur" TO "personne_referente";
-- downgrade --
ALTER TABLE "ficheaction" RENAME COLUMN "personne_referente" TO "porteur";
