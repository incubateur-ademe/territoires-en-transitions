-- upgrade --
ALTER TABLE IF EXISTS "indicateurvalue"
ALTER COLUMN "value" TYPE DOUBLE PRECISION USING "value"::DOUBLE PRECISION;
ALTER TABLE IF EXISTS "indicateurvalue"
    RENAME TO "indicateurresultat";
;
ALTER TABLE IF EXISTS "indicateurpersonnalisevalue"
ALTER COLUMN "value" TYPE DOUBLE PRECISION USING "value"::DOUBLE PRECISION;
ALTER TABLE IF EXISTS "indicateurpersonnalisevalue"
    RENAME TO "indicateurpersonnaliseresultat";
;
DROP TABLE IF EXISTS "indicateurvalue";
DROP TABLE IF EXISTS "indicateurpersonnalisevalue";
-- downgrade --
ALTER TABLE IF EXISTS "indicateurresultat"
ALTER COLUMN "value" TYPE VARCHAR(36) USING "value"::VARCHAR(36);
ALTER TABLE IF EXISTS "indicateurresultat"
    RENAME TO "indicateurvalue";
;
ALTER TABLE IF EXISTS "indicateurpersonnaliseresultat"
ALTER COLUMN "value" TYPE VARCHAR(36) USING "value"::VARCHAR(36);
ALTER TABLE IF EXISTS "indicateurpersonnaliseresultat"
    RENAME TO "indicateurpersonnalisevalue";
;
DROP TABLE IF EXISTS "indicateurpersonnaliseresultat";
DROP TABLE IF EXISTS "indicateurresultat";