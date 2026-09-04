set search_path to public;

-- Un dossier prêt à être instruit sur la DREAL Auvergne-Rhône-Alpes : de quoi
-- dérouler le dépôt d'avis de bout en bout sans passer par la DREAL
-- Bourgogne-Franche-Comté, dont les cinq dossiers couvrent déjà les autres
-- états du circuit (cf. 25-insert_fake_dreal.sql et 26-insert_fake_pcaet_avis.sql).
--
-- La DREAL elle-même vient de l'import des services réels
-- (collectivite/service_etat_import) : on la retrouve par sa région.

-- Correspondant DREAL : le compte de dev historique (11-insert_fake_user.sql),
-- rattaché en admin — le seul niveau qui ouvre l'invitation d'autres
-- correspondants. Mot de passe : yolododo
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', id, 'admin', TRUE
FROM collectivite WHERE type = 'dreal' AND region_code = '84'
ON CONFLICT (user_id, collectivite_id) DO UPDATE SET niveau_acces = 'admin', active = TRUE;

-- La déposante : Grenoble-Alpes-Métropole, région 84, donc couverte par cette
-- DREAL (la couverture instructeur se lit sur le code région).
CREATE TEMP TABLE dreal_ara_deposante AS
SELECT id FROM collectivite WHERE siren = '200040715';

DELETE FROM demarche_pcaet_demande_avis
WHERE demarche_id IN (
    SELECT id FROM demarche
    WHERE type = 'pcaet' AND collectivite_id IN (SELECT id FROM dreal_ara_deposante)
);
DELETE FROM demarche
WHERE type = 'pcaet' AND collectivite_id IN (SELECT id FROM dreal_ara_deposante);

-- Référente de la collectivité déposante : `envoyer-avis` cherche un contact
-- pour prévenir la collectivité, sans quoi l'envoi échoue. Mot de passe : yolododo
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '22222222-0cae-4bfc-a000-000000000004', 'authenticated', 'authenticated', 'lea@grenoblealpesmetropole.fr', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', now(), null, '', null, '', null, '', '', null, now(), '{"provider": "email", "providers": ["email"]}', '{}', null, now(), now(), null, null, '', '', null, '', 0, null, '', null) ON CONFLICT (id) DO NOTHING;
UPDATE dcp SET prenom = 'Léa', nom = 'Moreau', cgu_acceptees_le = current_timestamp WHERE user_id = '22222222-0cae-4bfc-a000-000000000004';
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '22222222-0cae-4bfc-a000-000000000004';
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '22222222-0cae-4bfc-a000-000000000004', id, 'admin', TRUE FROM dreal_ara_deposante
ON CONFLICT (user_id, collectivite_id) DO NOTHING;

-- Dossier transmis, échéance largement ouverte, aucun avis déposé : c'est
-- l'état « À instruire », le point de départ du dépôt d'avis.
WITH demarche_creee AS (
    INSERT INTO demarche (collectivite_id, type, titre, description, status, obligation, launched_at, transmitted_at, avis_deadline_at, created_by)
    SELECT id, 'pcaet', 'PCAET de la Métropole de Grenoble',
           'Dossier transmis en attente des avis du préfet de région et de l''autorité environnementale.',
           'transmis_pour_avis', 'obligatoire',
           now() - interval '20 months', now() - interval '5 days', now() + interval '85 days',
           '22222222-0cae-4bfc-a000-000000000004'
    FROM dreal_ara_deposante
    RETURNING id
),
journal AS (
    INSERT INTO demarche_status_history (demarche_id, from_status, to_status, transition, created_at, created_by)
    SELECT id, 'en_elaboration', 'transmis_pour_avis', 'transmettre_pour_avis', now() - interval '5 days',
           '22222222-0cae-4bfc-a000-000000000004'
    FROM demarche_creee
)
INSERT INTO demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source, created_at)
SELECT id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '84'), 'seed', now() - interval '5 days'
FROM demarche_creee;

DROP TABLE dreal_ara_deposante;
