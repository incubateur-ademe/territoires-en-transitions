set search_path to public;

CREATE TEMP TABLE pcaet_seed_deposantes AS
SELECT id FROM collectivite
WHERE siren IN ('200065647', '200010650', '245804406', '200069052', '200067114');

DELETE FROM demarche_pcaet_demande_avis
WHERE demarche_id IN (
    SELECT id FROM demarche
    WHERE type = 'pcaet' AND collectivite_id IN (SELECT id FROM pcaet_seed_deposantes)
);

DELETE FROM demarche
WHERE type = 'pcaet' AND collectivite_id IN (SELECT id FROM pcaet_seed_deposantes);

DROP TABLE pcaet_seed_deposantes;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '22222222-0cae-4bfc-a000-000000000001', 'authenticated', 'authenticated', 'marie@montbeliard.fr', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', now(), null, '', null, '', null, '', '', null, now(), '{"provider": "email", "providers": ["email"]}', '{}', null, now(), now(), null, null, '', '', null, '', 0, null, '', null) ON CONFLICT (id) DO NOTHING;
UPDATE dcp SET prenom = 'Marie', nom = 'Dupont', cgu_acceptees_le = current_timestamp WHERE user_id = '22222222-0cae-4bfc-a000-000000000001';
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '22222222-0cae-4bfc-a000-000000000001';
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '22222222-0cae-4bfc-a000-000000000001', id, 'admin', TRUE FROM collectivite WHERE siren = '200065647'
ON CONFLICT (user_id, collectivite_id) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '22222222-0cae-4bfc-a000-000000000002', 'authenticated', 'authenticated', 'karim@nevers.fr', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', now(), null, '', null, '', null, '', '', null, now(), '{"provider": "email", "providers": ["email"]}', '{}', null, now(), now(), null, null, '', '', null, '', 0, null, '', null) ON CONFLICT (id) DO NOTHING;
UPDATE dcp SET prenom = 'Karim', nom = 'Benali', cgu_acceptees_le = current_timestamp WHERE user_id = '22222222-0cae-4bfc-a000-000000000002';
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '22222222-0cae-4bfc-a000-000000000002';
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '22222222-0cae-4bfc-a000-000000000002', id, 'admin', TRUE FROM collectivite WHERE siren = '245804406'
ON CONFLICT (user_id, collectivite_id) DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '22222222-0cae-4bfc-a000-000000000003', 'authenticated', 'authenticated', 'sophie@auxerrois.fr', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', now(), null, '', null, '', null, '', '', null, now(), '{"provider": "email", "providers": ["email"]}', '{}', null, now(), now(), null, null, '', '', null, '', 0, null, '', null) ON CONFLICT (id) DO NOTHING;
UPDATE dcp SET prenom = 'Sophie', nom = 'Renard', cgu_acceptees_le = current_timestamp WHERE user_id = '22222222-0cae-4bfc-a000-000000000003';
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '22222222-0cae-4bfc-a000-000000000003';
INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '22222222-0cae-4bfc-a000-000000000003', id, 'admin', TRUE FROM collectivite WHERE siren = '200067114'
ON CONFLICT (user_id, collectivite_id) DO NOTHING;

WITH demarche_creee AS (
    INSERT INTO demarche (collectivite_id, type, titre, description, status, obligation, launched_at, transmitted_at, avis_deadline_at, created_by)
    SELECT c.id, 'pcaet', 'PCAET 2026-2032', 'Deuxième génération de PCAET du Pays de Montbéliard.', 'transmis_pour_avis', 'obligatoire',
           now() - interval '18 months', now() - interval '15 days', now() + interval '75 days',
           '22222222-0cae-4bfc-a000-000000000001'
    FROM collectivite c WHERE c.siren = '200065647'
    RETURNING id
),
journal AS (
    INSERT INTO demarche_status_history (demarche_id, from_status, to_status, transition, created_at, created_by)
    SELECT id, 'en_elaboration', 'transmis_pour_avis', 'transmettre_pour_avis', now() - interval '15 days',
           '22222222-0cae-4bfc-a000-000000000001'
    FROM demarche_creee
)
INSERT INTO demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source, created_at)
SELECT id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'seed', now() - interval '15 days'
FROM demarche_creee;

WITH demarche_creee AS (
    INSERT INTO demarche (collectivite_id, type, titre, description, status, obligation, launched_at, transmitted_at, avis_deadline_at)
    SELECT c.id, 'pcaet', 'PCAET du Grand Dole', 'Révision du plan climat air énergie territorial.', 'transmis_pour_avis', 'obligatoire',
           now() - interval '2 years', now() - interval '60 days', now() + interval '30 days'
    FROM collectivite c WHERE c.siren = '200010650'
    RETURNING id
),
journal AS (
    INSERT INTO demarche_status_history (demarche_id, from_status, to_status, transition, created_at)
    SELECT id, 'en_elaboration', 'transmis_pour_avis', 'transmettre_pour_avis', now() - interval '60 days'
    FROM demarche_creee
),
demande_creee AS (
    INSERT INTO demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source, created_at)
    SELECT id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'seed', now() - interval '60 days'
    FROM demarche_creee
    RETURNING id
)
INSERT INTO demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens, fichier_ref, valide_le, depose_par, depose_le)
SELECT demande_creee.id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'),
       'prefet_region', 'avec_reserves', NULL, NULL,
       '11111111-dea1-4bfc-a000-000000000002', now() - interval '3 days'
FROM demande_creee;

WITH demarche_creee AS (
    INSERT INTO demarche (collectivite_id, type, titre, description, status, obligation, launched_at, transmitted_at, avis_deadline_at, created_by)
    SELECT c.id, 'pcaet', 'PCAET de l''agglomération de Nevers', 'Plan climat air énergie territorial 2026-2032.', 'transmis_pour_avis', 'obligatoire',
           now() - interval '30 months', now() - interval '75 days', now() + interval '15 days',
           '22222222-0cae-4bfc-a000-000000000002'
    FROM collectivite c WHERE c.siren = '245804406'
    RETURNING id
),
journal AS (
    INSERT INTO demarche_status_history (demarche_id, from_status, to_status, transition, created_at, created_by)
    SELECT id, 'en_elaboration', 'transmis_pour_avis', 'transmettre_pour_avis', now() - interval '75 days',
           '22222222-0cae-4bfc-a000-000000000002'
    FROM demarche_creee
),
demande_creee AS (
    INSERT INTO demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source, created_at)
    SELECT id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'seed', now() - interval '75 days'
    FROM demarche_creee
    RETURNING id
)
INSERT INTO demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens, fichier_ref, valide_le, depose_par, depose_le, envoye_le)
SELECT demande_creee.id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'),
       avis_titre.au_titre_de, 'favorable', 'avis/avis-dreal-bfc-nevers.pdf', now() - interval '10 days',
       '11111111-dea1-4bfc-a000-000000000001', now() - interval '12 days', avis_titre.envoye_le
FROM demande_creee,
     (VALUES ('prefet_region', now() - interval '10 days'),
             ('autorite_environnementale', NULL::timestamptz)) AS avis_titre(au_titre_de, envoye_le);

WITH demarche_creee AS (
    INSERT INTO demarche (collectivite_id, type, titre, description, status, obligation, launched_at, transmitted_at, avis_deadline_at)
    SELECT c.id, 'pcaet', 'PCAET du Grand Belfort', 'Plan climat air énergie territorial.', 'transmis_pour_avis', 'obligatoire',
           now() - interval '3 years', now() - interval '120 days', now() - interval '30 days'
    FROM collectivite c WHERE c.siren = '200069052'
    RETURNING id
),
journal AS (
    INSERT INTO demarche_status_history (demarche_id, from_status, to_status, transition, created_at)
    SELECT id, 'en_elaboration', 'transmis_pour_avis', 'transmettre_pour_avis', now() - interval '120 days'
    FROM demarche_creee
),
demande_creee AS (
    INSERT INTO demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source, created_at)
    SELECT id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'seed', now() - interval '120 days'
    FROM demarche_creee
    RETURNING id
)
INSERT INTO demarche_pcaet_avis (demande_avis_id, emetteur_collectivite_id, au_titre_de, sens, fichier_ref, valide_le, depose_par, depose_le, modifie_le)
SELECT demande_creee.id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'),
       'prefet_region', 'defavorable', NULL, NULL,
       '11111111-dea1-4bfc-a000-000000000001', now() - interval '95 days', now() - interval '80 days'
FROM demande_creee;

WITH demarche_creee AS (
    INSERT INTO demarche (collectivite_id, type, titre, description, status, obligation, launched_at, transmitted_at, avis_deadline_at, published_at, created_by)
    SELECT c.id, 'pcaet', 'PCAET de l''Auxerrois', 'Plan climat air énergie territorial adopté en conseil communautaire.', 'publie', 'obligatoire',
           now() - interval '4 years', now() - interval '200 days', now() - interval '110 days', now() - interval '90 days',
           '22222222-0cae-4bfc-a000-000000000003'
    FROM collectivite c WHERE c.siren = '200067114'
    RETURNING id
),
journal AS (
    INSERT INTO demarche_status_history (demarche_id, from_status, to_status, transition, created_at, created_by)
    SELECT d.id, etape.from_status, etape.to_status, etape.transition, etape.created_at,
           '22222222-0cae-4bfc-a000-000000000003'
    FROM demarche_creee d,
         (VALUES ('en_elaboration', 'transmis_pour_avis', 'transmettre_pour_avis', now() - interval '200 days'),
                 ('transmis_pour_avis', 'adopte', 'adopter', now() - interval '100 days'),
                 ('adopte', 'publie', 'publier', now() - interval '90 days')) AS etape(from_status, to_status, transition, created_at)
)
INSERT INTO demarche_pcaet_demande_avis (demarche_id, instructeur_collectivite_id, source, created_at)
SELECT id, (SELECT id FROM collectivite WHERE type = 'dreal' AND region_code = '27'), 'seed', now() - interval '200 days'
FROM demarche_creee;
