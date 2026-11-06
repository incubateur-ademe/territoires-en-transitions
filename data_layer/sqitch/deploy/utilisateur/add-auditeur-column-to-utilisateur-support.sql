-- Deploy tet:utilisateur/add-auditeur-column-to-utilisateur-support to pg

BEGIN;

ALTER TABLE utilisateur_support
ADD COLUMN has_role_tete_auditeur boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN utilisateur_support.has_role_tete_auditeur IS 'Personne habilitée à auditer : proposée par l''équipe du programme TETE lors de l''attribution d''un auditeur à un dossier de labellisation.';

-- Toute personne ayant déjà été attribuée à un audit est auditeur
-- (crée d'abord les lignes manquantes : comptes antérieurs au trigger sur dcp)
INSERT INTO utilisateur_support (user_id)
SELECT DISTINCT aa.auditeur
FROM audit_auditeur aa
JOIN dcp ON dcp.user_id = aa.auditeur
ON CONFLICT (user_id) DO NOTHING;

UPDATE utilisateur_support
SET has_role_tete_auditeur = true
WHERE user_id IN (SELECT auditeur FROM audit_auditeur);

COMMIT;
