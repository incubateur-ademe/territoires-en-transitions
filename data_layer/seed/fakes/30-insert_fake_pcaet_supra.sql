set search_path to public;

-- Dépôts PCAET portés par un Supra : un seul compte pour dérouler tous les cas
-- en local, sur des Supras et des EPCI réels, reliés comme dans l'import de prod
-- (collectivites.relations.importSyndicatEpciRelations).
--
-- Compte : supra@dodo.com / yolododo. Un compte à part plutôt que Yolo, dont la
-- liste exacte des collectivités est figée par list-users.controller.spec.ts.
--
-- | Collectivité (droit)                          | Cas                                    |
-- |-----------------------------------------------|----------------------------------------|
-- | Pôle territorial Albigeois et Bastides (admin)| premier dépôt : 5 CC, un état chacune  |
-- | SICTOM secteur Valence Valderiès (admin)      | dépôt en cours qui couvre CC Val 81    |
-- | PETR du Pays Lauragais (admin)                | renouvellement : 3 CC pré-cochées      |
-- | SM du Pays de la Haute Sarthe (admin)         | Supra sans EPCI membre connu           |
-- | CC Val 81 (édition)                           | EPCI couvert par le dépôt du SICTOM    |
--
-- Les 5 CC de l'Albigeois, à la création d'un dépôt :
--   - CC du Cordais et du Causse : aucune élaboration ;
--   - CC des Monts d'Alban et du Villefranchois : PCAET publié ;
--   - CC Carmausin-Ségala : PCAET archivé ;
--   - CC Centre Tarn : sa propre démarche en cours (indisponible) ;
--   - CC Val 81 : couverte par le dépôt en cours du SICTOM (indisponible).

CREATE TEMP TABLE supra_seed (role text, siren text);
INSERT INTO supra_seed VALUES
    ('albigeois', '200049161'),
    ('sictom', '200073807'),
    ('lauragais', '200050938'),
    ('haute_sarthe', '257202358'),
    ('cordais', '200034064'),
    ('monts_alban', '200034031'),
    ('carmausin', '200040905'),
    ('centre_tarn', '200034049'),
    ('val_81', '248100497'),
    ('piege', '200035707'),
    ('castelnaudary', '200035855'),
    ('terres_lauragais', '200071298'),
    ('revel', '243100567');

CREATE TEMP TABLE supra_seed_id AS
SELECT s.role, c.id
FROM supra_seed s
JOIN collectivite c ON c.siren = s.siren AND c.type = 'epci';

-- Rejouable : on repart des démarches de ces collectivités.
DELETE FROM demarche
WHERE type = 'pcaet' AND collectivite_id IN (SELECT id FROM supra_seed_id);

-- Liens Supra → EPCI membres (enfant dans `id`, parent dans `parent_id`).
INSERT INTO collectivite_relations (id, parent_id)
SELECT m.id, p.id
FROM (VALUES
    ('albigeois', 'cordais'),
    ('albigeois', 'monts_alban'),
    ('albigeois', 'carmausin'),
    ('albigeois', 'centre_tarn'),
    ('albigeois', 'val_81'),
    ('sictom', 'carmausin'),
    ('sictom', 'val_81'),
    ('lauragais', 'piege'),
    ('lauragais', 'castelnaudary'),
    ('lauragais', 'terres_lauragais'),
    ('lauragais', 'revel')
) AS lien (parent, membre)
JOIN supra_seed_id p ON p.role = lien.parent
JOIN supra_seed_id m ON m.role = lien.membre
ON CONFLICT DO NOTHING;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) VALUES ('00000000-0000-0000-0000-000000000000', '33333333-5a9a-4bfc-a000-000000000001', 'authenticated', 'authenticated', 'supra@dodo.com', '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C', now(), null, '', null, '', null, '', '', null, now(), '{"provider": "email", "providers": ["email"]}', '{}', null, now(), now(), null, null, '', '', null, '', 0, null, '', null) ON CONFLICT (id) DO NOTHING;
UPDATE dcp SET prenom = 'Supra', nom = 'Dodo', cgu_acceptees_le = current_timestamp WHERE user_id = '33333333-5a9a-4bfc-a000-000000000001';
UPDATE utilisateur_verifie SET verifie = true WHERE user_id = '33333333-5a9a-4bfc-a000-000000000001';

INSERT INTO private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
SELECT '33333333-5a9a-4bfc-a000-000000000001', id,
       (CASE WHEN role = 'val_81' THEN 'edition' ELSE 'admin' END)::niveau_acces, TRUE
FROM supra_seed_id
WHERE role IN ('albigeois', 'sictom', 'lauragais', 'haute_sarthe', 'val_81')
ON CONFLICT (user_id, collectivite_id) DO NOTHING;

-- Démarches propres des CC de l'Albigeois.
INSERT INTO demarche (collectivite_id, type, titre, status, obligation, launched_at, adopted_at, published_at)
SELECT s.id, 'pcaet', d.titre, d.status, 'obligatoire', d.launched_at::timestamptz,
       d.adopted_at::date, d.published_at::timestamptz
FROM (VALUES
    ('monts_alban', 'PCAET 2021-2027', 'publie', '2019-03-01', '2021-06-30', '2021-07-15'),
    ('carmausin', 'PCAET 2016-2022', 'archive', '2014-09-01', '2016-11-20', '2016-12-01'),
    ('centre_tarn', 'PCAET 2026-2032', 'en_elaboration', '2025-09-15', null, null)
) AS d (role, titre, status, launched_at, adopted_at, published_at)
JOIN supra_seed_id s ON s.role = d.role;

-- Dépôt en cours du SICTOM, qui couvre CC Val 81.
WITH depot AS (
    INSERT INTO demarche (collectivite_id, type, titre, status, obligation, launched_at, created_by)
    SELECT id, 'pcaet', 'PCAET du secteur Valence Valderiès', 'en_elaboration', 'volontaire',
           '2026-03-02', '33333333-5a9a-4bfc-a000-000000000001'
    FROM supra_seed_id WHERE role = 'sictom'
    RETURNING id
)
INSERT INTO demarche_pcaet_collectivite_couverte (demarche_id, collectivite_id, created_by)
SELECT depot.id, s.id, '33333333-5a9a-4bfc-a000-000000000001'
FROM depot
JOIN supra_seed_id s ON s.role = 'val_81';

-- Dépôt publié du Lauragais : CC Lauragais Revel Sorezois n'en était pas, un
-- nouveau dépôt pré-coche donc les trois autres.
WITH depot AS (
    INSERT INTO demarche (collectivite_id, type, titre, status, obligation, launched_at, adopted_at, published_at, created_by)
    SELECT id, 'pcaet', 'PCAET du Pays Lauragais 2020-2026', 'publie', 'volontaire',
           '2017-10-02', '2020-02-10', '2020-03-01', '33333333-5a9a-4bfc-a000-000000000001'
    FROM supra_seed_id WHERE role = 'lauragais'
    RETURNING id
)
INSERT INTO demarche_pcaet_collectivite_couverte (demarche_id, collectivite_id, created_by)
SELECT depot.id, s.id, '33333333-5a9a-4bfc-a000-000000000001'
FROM depot
JOIN supra_seed_id s ON s.role IN ('piege', 'castelnaudary', 'terres_lauragais');

DROP TABLE supra_seed_id;
DROP TABLE supra_seed;
