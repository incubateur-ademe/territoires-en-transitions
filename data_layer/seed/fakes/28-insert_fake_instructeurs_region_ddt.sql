set search_path to public;

-- ===========================================================================
-- Les deux autres destinataires d'une transmission, à côté de la DREAL.
--
-- Le trio se lit sur la collectivité 1 (Ambérieu-en-Bugey, région 84,
-- département 01) : la DREAL Auvergne-Rhône-Alpes la couvre par sa région, la
-- Région Auvergne-Rhône-Alpes aussi, et la DDT de l'Ain par son département.
-- Transmettre son dossier doit donc le faire apparaître dans les trois
-- tableaux — deux en lecture seule, seule la DREAL étant saisie pour avis.
--
-- Ni SIREN ni population pour la DDT : comme une DREAL, elle n'a pas de
-- territoire propre. Le conseil régional, lui, existe déjà comme collectivité
-- (type `region`) — il n'est pas créé ici, seulement rattaché.
-- ===========================================================================

INSERT INTO collectivite (nom, type, departement_code, region_code)
VALUES ('DDT de l''Ain', 'ddt', '01', '84')
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- Le compte de dev sur les trois instructeurs, en admin — le seul niveau qui
-- ouvre l'invitation d'autres correspondants. Mot de passe : yolododo
-- ===========================================================================
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', id, 'admin', TRUE
FROM collectivite
WHERE (type = 'dreal'  AND region_code = '84')
   OR (type = 'ddt'    AND departement_code = '01')
   OR (type = 'region' AND region_code = '84')
ON CONFLICT (user_id, collectivite_id) DO UPDATE
    SET niveau_acces = 'admin', active = TRUE;

-- ===========================================================================
-- Garde-fou : le scénario ne tient que si la collectivité 1 est bien dans le
-- département de la DDT et la région de la DREAL. Mieux vaut un seed qui
-- échoue qu'un tableau vide qu'on met une heure à expliquer.
-- ===========================================================================
DO $$
DECLARE
    region_1      text;
    departement_1 text;
BEGIN
    SELECT region_code, departement_code INTO region_1, departement_1
    FROM collectivite WHERE id = 1;

    IF region_1 IS DISTINCT FROM '84' THEN
        RAISE EXCEPTION
            'La collectivité 1 est en région % : la DREAL 84 ne la couvre pas', region_1;
    END IF;

    IF departement_1 IS DISTINCT FROM '01' THEN
        RAISE EXCEPTION
            'La collectivité 1 est dans le département % : la DDT 01 ne la couvre pas', departement_1;
    END IF;
END $$;
