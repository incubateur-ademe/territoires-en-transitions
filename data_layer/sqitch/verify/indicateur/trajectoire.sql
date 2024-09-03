-- Verify tet:indicateur/trajectoire on pg

BEGIN;

SELECT 1/COUNT(*) FROM groupement WHERE nom = 'trajectoire';

SELECT 1/COUNT(*) FROM indicateur_definition WHERE groupement_id = (SELECT id from groupement where nom = 'trajectoire')
AND identifiant_referentiel in ('cae_63.ca','cae_63.cb','cae_63.da','cae_63.db','cae_63.e','cae_63.cc','cae_63.cd','cae_1.csc', 'cae_1.aa','cae_1.ca', 'cae_1.cb', 'cae_1.cc', 'cae_1.da', 'cae_1.db', 'cae_1.ia', 'cae_1.ib', 'cae_1.ic', 'cae_1.id', 'cae_1.ie', 'cae_1.if', 'cae_1.ig', 'cae_1.ga', 'cae_1.gb', 'cae_1.gc', 'cae_1.ea', 'cae_1.eb', 'cae_1.k', 'cae_2.ea', 'cae_2.eb', 'cae_2.ec', 'cae_2.fa', 'cae_2.fb', 'cae_2.ka', 'cae_2.kb', 'cae_2.kc', 'cae_2.kd', 'cae_2.ke', 'cae_2.kf', 'cae_2.kg','cae_2.m');

ROLLBACK;
