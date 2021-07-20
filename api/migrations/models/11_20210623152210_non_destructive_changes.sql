-- upgrade --
ALTER TABLE "epci" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "ficheaction" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "ficheaction" ADD "deleted" BOOL NOT NULL DEFAULT FALSE;
ALTER TABLE "utilisateur" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "actionstatus" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "indicateurvalue" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "utilisateurdroits" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "ficheactioncategorie" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "ficheactioncategorie" ADD "deleted" BOOL NOT NULL DEFAULT FALSE;
ALTER TABLE "indicateurpersonnalise" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "indicateurpersonnalise" ADD "deleted" BOOL NOT NULL DEFAULT FALSE;
ALTER TABLE "indicateurpersonnalisevalue" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
ALTER TABLE "indicateurreferentielcommentaire" ADD "latest" BOOL NOT NULL DEFAULT TRUE;
-- downgrade --
ALTER TABLE "actionstatus" DROP COLUMN "latest";
ALTER TABLE "indicateurvalue" DROP COLUMN "latest";
ALTER TABLE "ficheaction" DROP COLUMN "latest";
ALTER TABLE "ficheaction" DROP COLUMN "deleted";
ALTER TABLE "ficheactioncategorie" DROP COLUMN "latest";
ALTER TABLE "ficheactioncategorie" DROP COLUMN "deleted";
ALTER TABLE "indicateurpersonnalise" DROP COLUMN "latest";
ALTER TABLE "indicateurpersonnalise" DROP COLUMN "deleted";
ALTER TABLE "indicateurpersonnalisevalue" DROP COLUMN "latest";
ALTER TABLE "indicateurreferentielcommentaire" DROP COLUMN "latest";
ALTER TABLE "utilisateur" DROP COLUMN "latest";
ALTER TABLE "utilisateurdroits" DROP COLUMN "latest";
ALTER TABLE "epci" DROP COLUMN "latest";
