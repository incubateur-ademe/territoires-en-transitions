set search_path to public;

-- ===========================================================================
-- Les deux dernières familles autour de la table, toutes deux en lecture.
--
-- La collectivité 1 (Ambérieu-en-Bugey, région 84, département 01) a pour
-- destinataires la DREAL et le conseil régional Auvergne-Rhône-Alpes, la DDT de
-- l'Ain, la DR ADEME Auvergne-Rhône-Alpes, puis les services nationaux, qui les
-- voient tous sans être rattachés à quoi que ce soit — d'où leur absence de code
-- géographique.
--
-- Ils sont deux depuis l'import : la DGEC et l'ADEME nationale, toutes deux
-- destinataires de chaque transmission. Aucune assertion ne doit donc compter
-- les destinataires en dur.
--
-- Ni la DR ADEME ni la DGEC ne sont créées ici : elles viennent de l'import des
-- services réels (collectivite/service_etat_import). La DGEC s'y retrouve par son
-- SIREN et non par son nom : l'import porte « Direction Générale de l'Énergie et
-- du Climat (DGEC) », pas la forme courte que ce seed utilisait.
-- ===========================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM collectivite WHERE type = 'dr_ademe' AND region_code = '84') THEN
        RAISE EXCEPTION
            'Aucune DR ADEME sur la région 84 : le change collectivite/service_etat_import n''est pas déployé';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM collectivite WHERE type = 'service_national' AND siren = '120087010') THEN
        RAISE EXCEPTION
            'La DGEC (SIREN 120087010) est absente : le change collectivite/service_etat_import n''est pas déployé';
    END IF;
END $$;

-- Le compte de dev sur les deux, en admin. Mot de passe : yolododo
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', id, 'admin', TRUE
FROM collectivite
WHERE (type = 'dr_ademe' AND region_code = '84')
   OR (type = 'service_national' AND siren = '120087010')
ON CONFLICT (user_id, collectivite_id) DO UPDATE
    SET niveau_acces = 'admin', active = TRUE;
