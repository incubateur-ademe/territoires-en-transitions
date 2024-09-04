-- Deploy tet:indicateur/trajectoire to pg

BEGIN;

-- supprime les indicateurs créés manuellement par Juliette en preprod/prod et dont la reference a changé
DELETE FROM indicateur_definition
WHERE identifiant_referentiel in ('cae_63.f', 'cae_63.g', 'cae_63.h', 'cae_63.i', 'cae_63.j', 'cae_63.k');

-- on créé un groupement pour les collectivités qui vont réaliser leurs trajectoires --> déjà créer en préprod et prod
-- Pas d'unicité sur le nom pour l'instant donc on utilise cette query
INSERT INTO groupement (nom)
SELECT 'trajectoire' AS nom
WHERE NOT EXISTS(
            SELECT id FROM groupement WHERE nom = 'trajectoire'
    )
LIMIT 1;

-- actualise le groupement_id pour les indicateurs liés à la trajectoire qu'on ne souhaite pas visible par défaut
UPDATE indicateur_definition
SET groupement_id = (SELECT id from groupement where nom = 'trajectoire') 
WHERE identifiant_referentiel in ('cae_63.ca','cae_63.cb','cae_63.da','cae_63.db','cae_63.e','cae_63.cc','cae_63.cd','cae_1.csc', 'cae_1.aa','cae_1.ca', 'cae_1.cb', 'cae_1.cc', 'cae_1.da', 'cae_1.db', 'cae_1.ia', 'cae_1.ib', 'cae_1.ic', 'cae_1.id', 'cae_1.ie', 'cae_1.if', 'cae_1.ig', 'cae_1.ga', 'cae_1.gb', 'cae_1.gc', 'cae_1.ea', 'cae_1.eb', 'cae_1.k', 'cae_2.ea', 'cae_2.eb', 'cae_2.ec', 'cae_2.fa', 'cae_2.fb', 'cae_2.ka', 'cae_2.kb', 'cae_2.kc', 'cae_2.kd', 'cae_2.ke', 'cae_2.kf', 'cae_2.kg','cae_2.m')
;

-- on supprime la parenté avec l'indicateur traj_1 puis on supprime l'indicateur traj_1 dont nous n'avons plus besoin
DELETE from indicateur_groupe 
where parent = (select id from indicateur_definition WHERE identifiant_referentiel = 'traj_1');
DELETE from indicateur_definition
where identifiant_referentiel ='traj_1';

COMMIT;
