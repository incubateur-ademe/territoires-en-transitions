set search_path to public;

-- La DREAL Bourgogne-Franche-Comté (spec dépôt PCAET, annexe A) n'est plus créée
-- ici : elle vient de l'import des services réels
-- (collectivite/service_etat_import), qui la pose sur la région 27 avec son SIREN
-- et son NIC. Ce seed ne fait plus que lui rattacher les comptes de dev.
--
-- Ne jamais résoudre un service par son nom : l'import porte la dénomination
-- officielle, longue, et non la forme courte que ce seed utilisait.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM collectivite WHERE type = 'dreal' AND region_code = '27') THEN
        RAISE EXCEPTION
            'Aucune DREAL sur la région 27 : le change collectivite/service_etat_import n''est pas déployé';
    END IF;
END $$;

-- Camille, correspondante DREAL — admin. Mot de passe : yolododo
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '11111111-dea1-4bfc-a000-000000000001', 'authenticated', 'authenticated', 'camille@dreal.fr', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', '2026-08-05 10:00:00.000000 +00:00', null, '', null, '', null, '', '', null, '2026-08-05 10:00:00.000000 +00:00', '{"provider": "email", "providers": ["email"]}', '{}', null, '2026-08-05 10:00:00.000000 +00:00', '2026-08-05 10:00:00.000000 +00:00', null, null, '', '', null, '', 0, null, '', null);
UPDATE dcp SET prenom = 'Camille', nom = 'Dreal', cgu_acceptees_le = current_timestamp WHERE user_id = '11111111-dea1-4bfc-a000-000000000001';
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
VALUES ('11111111-dea1-4bfc-a000-000000000001', (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'admin', TRUE);
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '11111111-dea1-4bfc-a000-000000000001';

-- Mehdi, correspondant DREAL — édition. Mot de passe : yolododo
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '11111111-dea1-4bfc-a000-000000000002', 'authenticated', 'authenticated', 'mehdi@dreal.fr', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', '2026-08-05 10:00:00.000000 +00:00', null, '', null, '', null, '', '', null, '2026-08-05 10:00:00.000000 +00:00', '{"provider": "email", "providers": ["email"]}', '{}', null, '2026-08-05 10:00:00.000000 +00:00', '2026-08-05 10:00:00.000000 +00:00', null, null, '', '', null, '', 0, null, '', null);
UPDATE dcp SET prenom = 'Mehdi', nom = 'Dreal', cgu_acceptees_le = current_timestamp WHERE user_id = '11111111-dea1-4bfc-a000-000000000002';
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
VALUES ('11111111-dea1-4bfc-a000-000000000002', (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'edition', TRUE);
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '11111111-dea1-4bfc-a000-000000000002';
