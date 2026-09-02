set search_path to public;

-- ===========================================================================
-- Les deux dernières familles autour de la table, toutes deux en lecture.
--
-- La collectivité 1 (Ambérieu-en-Bugey, région 84, département 01) a désormais
-- cinq destinataires : DREAL et conseil régional Auvergne-Rhône-Alpes, DDT de
-- l'Ain, DR ADEME Auvergne-Rhône-Alpes, et la DGEC qui les voit tous sans être
-- rattachée à quoi que ce soit — d'où son absence de code géographique.
--
-- La DGEC est un service national parmi d'autres à venir (ADEME nationale…) :
-- une ligne de plus suffira.
-- ===========================================================================

INSERT INTO collectivite (nom, type, region_code)
VALUES ('DR ADEME Auvergne-Rhône-Alpes', 'dr_ademe', '84')
ON CONFLICT DO NOTHING;

INSERT INTO collectivite (nom, type)
SELECT 'DGEC', 'service_national'
WHERE NOT EXISTS (
    SELECT 1 FROM collectivite WHERE type = 'service_national' AND nom = 'DGEC'
);

-- Le compte de dev sur les deux, en admin. Mot de passe : yolododo
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', id, 'admin', TRUE
FROM collectivite
WHERE (type = 'dr_ademe' AND region_code = '84')
   OR (type = 'service_national' AND nom = 'DGEC')
ON CONFLICT (user_id, collectivite_id) DO UPDATE
    SET niveau_acces = 'admin', active = TRUE;
