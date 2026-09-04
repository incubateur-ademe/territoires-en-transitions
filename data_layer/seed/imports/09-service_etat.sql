-- Services de l'État instructeurs du dépôt PCAET : DREAL, DDT, DR ADEME et
-- services nationaux, plus le SIREN et le NIC des conseils régionaux.
--
-- Source : data_layer/seed/sources/service-etat/*.csv (classeur remis par l'ADEME,
-- cf. le README du dossier). Fichier généré — régénérer avec
-- `make seeds_rebuild_from_source`
-- (script : data_layer/scripts/generate_service_etat.py).
--
-- Le même corps est porté par le change sqitch
-- `collectivite/service_etat_import` : ce fichier sert les bases neuves
-- (`make db-init` / `db-reset`), le change sert les bases déjà peuplées, où le
-- seed ne repasse jamais. Les deux sont idempotents et se recoupent sans dégât.

begin;

-- Ce corps est joué à deux endroits — le change sqitch
-- `collectivite/service_etat_import` et ce seed — et chaque bloc porte
-- `where exists (select 1 from collectivite)`.
--
-- Cette garde n'est pas une précaution, c'est le cœur du dispositif. Une base
-- neuve est **vide** au moment des migrations : y insérer 130 collectivités
-- consommerait la séquence d'`id` avant le seed, et la collectivité 1 ne serait
-- plus Ambérieu-en-Bugey mais une DREAL. Or des ids sont écrits en clair dans le
-- dépôt — `07-banatic_2025_competence_par_collectivite.sql` en cite des milliers,
-- les seeds de développement s'appuient sur la collectivité 1. Tout se
-- décalerait d'un cran.
--
-- Donc : sur une base neuve la migration ne fait rien, et c'est le seed qui
-- peuple, à sa place dans l'ordre de chargement (après `content/`, donc après
-- les communes et les EPCI). Sur une base déjà peuplée — staging, production —
-- le seed ne repasse jamais et c'est la migration qui agit. Les deux chemins
-- sont idempotents et se recoupent sans dégât.

-- Les DREAL. Un service de l'État est une ligne de `collectivite`, sa famille
-- est son `type`, et son périmètre son code géographique. La clé d'appariement
-- est l'index unique partiel que la base porte déjà
-- (`collectivite_dreal_unique_region_code`) : reconnaître une DREAL à sa région,
-- jamais à son nom.
--
-- `nom` est volontairement absent du `do update` : un service déjà nommé en base
-- garde son nom. La DREAL Pays de la Loire créée à la main en production reste
-- « DREAL Pays de la Loire » et gagne seulement son SIREN et son NIC.
--
-- Ni population ni territoire : une DREAL n'a pas de territoire propre. Le bucket
-- de stockage est créé par le trigger `after_collectivite_write`.
insert into collectivite (nom, type, region_code, siren, nic)
select v.nom, v.type, v.region_code, v.siren, v.nic
from (values
        ('Direction de l''Environnement, de l''Aménagement et du Logement Guadeloupe (DEAL)', 'dreal', '01', '130013915', '00017'),
        ('Direction de l''Environnement, de l''Aménagement et du Logement Martinique (DEAL)', 'dreal', '02', '130014236', '00017'),
        ('Direction Générale des Territoires et de la Mer (DGTM)', 'dreal', '03', '130026586', '00011'),
        ('Direction de l''Environnement, de l''Aménagement et du Logement La Réunion (DEAL)', 'dreal', '04', '130014368', '00018'),
        ('Direction de l''Environnement, de l''Aménagement, du Logement et de la Mer de Mayotte (DEALM)', 'dreal', '06', '130017395', '00018'),
        ('Direction Régionale et interdépartementale de l''environnement, de l''aménagement et des transports (DRIEAT) - Île-de-France', 'dreal', '11', '130029325', '00011'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Centre-Val de Loire (DREAL)', 'dreal', '24', '130009301', '00016'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Bourgogne-Franche-Comté (DREAL)', 'dreal', '27', '130009012', '00167'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Normandie (DREAL)', 'dreal', '28', '130006265', '00016'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Hauts-de-France (DREAL)', 'dreal', '32', '130006570', '00019'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Grand Est (DREAL)', 'dreal', '44', '130010259', '00252'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Pays de la Loire (DREAL)', 'dreal', '52', '130006109', '00057'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Bretagne (DREAL)', 'dreal', '53', '130010002', '00017'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Nouvelle-Aquitaine (DREAL)', 'dreal', '75', '130010457', '00013'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Occitanie (DREAL)', 'dreal', '76', '130006091', '00313'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Auvergne-Rhône-Alpes (DREAL)', 'dreal', '84', '130006729', '00029'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Provence-Alpes-Côte d''Azur (DREAL)', 'dreal', '93', '130006380', '00013'),
        ('Direction Régionale de l''Environnement, de l''Aménagement et du Logement Corse (DREAL)', 'dreal', '94', '130006596', '00030')
) as v (nom, type, region_code, siren, nic)
where exists (select 1 from collectivite)
on conflict (type, region_code) where type = 'dreal'
do update set siren = excluded.siren,
              nic   = excluded.nic;

-- Les DDT, appariées sur le département (`collectivite_ddt_unique_departement_code`).
-- Les DDTM sont des DDT : la mer est dans leur nom, pas dans leur famille. Le
-- code région, lui, est un fait géographique et non un nom — on le reporte.
insert into collectivite (nom, type, departement_code, region_code, siren, nic)
select v.nom, v.type, v.departement_code, v.region_code, v.siren, v.nic
from (values
        ('Direction départementale des territoires (DDT) - Ain', 'ddt', '01', '84', '130009368', '00015'),
        ('Direction départementale des territoires (DDT) - Aisne', 'ddt', '02', '32', '130009780', '00011'),
        ('Direction départementale des territoires (DDT) - Allier', 'ddt', '03', '84', '130008196', '00011'),
        ('Direction départementale des territoires (DDT) - Alpes-de-Haute-Provence', 'ddt', '04', '93', '130009517', '00017'),
        ('Direction départementale des territoires (DDT) - Hautes-Alpes', 'ddt', '05', '93', '130007818', '00011'),
        ('Direction départementale des territoires et de la mer (DDTM) - Alpes-Maritimes', 'ddt', '06', '93', '130011232', '00019'),
        ('Direction départementale des territoires (DDT) - Ardèche', 'ddt', '07', '84', '130011349', '00011'),
        ('Direction départementale des territoires (DDT) - Ardennes', 'ddt', '08', '44', '130010390', '00016'),
        ('Direction départementale des territoires (DDT) - Ariège', 'ddt', '09', '76', '130011786', '00014'),
        ('Direction départementale des territoires (DDT) - Aube', 'ddt', '10', '44', '130009285', '00011'),
        ('Direction départementale des territoires et de la mer (DDTM) - Aude', 'ddt', '11', '76', '130009004', '00016'),
        ('Direction départementale des territoires (DDT) - Aveyron', 'ddt', '12', '76', '130007784', '00015'),
        ('Direction départementale des territoires et de la mer (DDTM) - Bouches-du-Rhône', 'ddt', '13', '93', '130010135', '00015'),
        ('Direction départementale des territoires et de la mer (DDTM) - Calvados', 'ddt', '14', '28', '130009020', '00012'),
        ('Direction départementale des territoires (DDT) - Cantal', 'ddt', '15', '84', '130008345', '00014'),
        ('Direction départementale des territoires (DDT) - Charente', 'ddt', '16', '75', '130010986', '00011'),
        ('Direction départementale des territoires et de la mer (DDTM) - Charente-Maritime', 'ddt', '17', '75', '130010291', '00016'),
        ('Direction départementale des territoires (DDT) - Cher', 'ddt', '18', '24', '130008634', '00045'),
        ('Direction départementale des territoires (DDT) - Corrèze', 'ddt', '19', '75', '130010903', '00016'),
        ('Direction départementale des territoires (DDT) - Côte-d''Or', 'ddt', '21', '27', '130009525', '00010'),
        ('Direction départementale des territoires et de la mer (DDTM) - Côtes-d''Armor', 'ddt', '22', '53', '130010671', '00019'),
        ('Direction départementale des territoires (DDT) - Creuse', 'ddt', '23', '75', '130009657', '00011'),
        ('Direction départementale des territoires (DDT) - Dordogne', 'ddt', '24', '75', '130010820', '00012'),
        ('Direction départementale des territoires (DDT) - Doubs', 'ddt', '25', '27', '130009988', '00135'),
        ('Direction départementale des territoires (DDT) - Drôme', 'ddt', '26', '84', '130007750', '00016'),
        ('Direction départementale des territoires et de la mer (DDTM) - Eure', 'ddt', '27', '28', '130011158', '00016'),
        ('Direction départementale des territoires (DDT) - Eure-et-Loir', 'ddt', '28', '24', '130009061', '00016'),
        ('Direction départementale des territoires et de la mer (DDTM) - Finistère', 'ddt', '29', '53', '130010473', '00010'),
        ('Direction départementale des territoires (DDT) - Corse-du-Sud', 'ddt', '2A', '94', '130010812', '00019'),
        ('Direction départementale des territoires (DDT) - Haute-Corse', 'ddt', '2B', '94', '130010911', '00019'),
        ('Direction départementale des territoires et de la mer (DDTM) - Gard', 'ddt', '30', '76', '130010283', '00013'),
        ('Direction départementale des territoires (DDT) - Haute-Garonne', 'ddt', '31', '76', '130010747', '00041'),
        ('Direction départementale des territoires (DDT) - Gers', 'ddt', '32', '76', '130008642', '00014'),
        ('Direction départementale des territoires et de la mer (DDTM) - Gironde', 'ddt', '33', '75', '130011240', '00012'),
        ('Direction départementale des territoires et de la mer (DDTM) - Hérault', 'ddt', '34', '76', '130008568', '00060'),
        ('Direction départementale des territoires et de la mer (DDTM) - Ille-et-Vilaine', 'ddt', '35', '53', '130010937', '00014'),
        ('Direction départementale des territoires (DDT) - Indre', 'ddt', '36', '24', '130009939', '00013'),
        ('Direction départementale des territoires (DDT) - Indre-et-Loire', 'ddt', '37', '24', '130010275', '00019'),
        ('Direction départementale des territoires (DDT) - Isère', 'ddt', '38', '84', '130010960', '00016'),
        ('Direction départementale des territoires (DDT) - Jura', 'ddt', '39', '27', '130012602', '00012'),
        ('Direction départementale des territoires et de la mer (DDTM) - Landes', 'ddt', '40', '75', '130010481', '00013'),
        ('Direction départementale des territoires (DDT) - Loir-et-Cher', 'ddt', '41', '24', '130010325', '00061'),
        ('Direction départementale des territoires (DDT) - Loire', 'ddt', '42', '84', '130010622', '00020'),
        ('Direction départementale des territoires (DDT) - Haute-Loire', 'ddt', '43', '84', '130008915', '00014'),
        ('Direction départementale des territoires et de la mer (DDTM) - Loire-Atlantique', 'ddt', '44', '52', '130008311', '00016'),
        ('Direction départementale des territoires (DDT) - Loiret', 'ddt', '45', '24', '130011000', '00010'),
        ('Direction départementale des territoires (DDT) - Lot', 'ddt', '46', '76', '130010408', '00016'),
        ('Direction départementale des territoires (DDT) - Lot-et-Garonne', 'ddt', '47', '75', '130010523', '00012'),
        ('Direction départementale des territoires (DDT) - Lozère', 'ddt', '48', '76', '130011273', '00013'),
        ('Direction départementale des territoires (DDT) - Maine-et-Loire', 'ddt', '49', '52', '130010341', '00019'),
        ('Direction départementale des territoires et de la mer (DDTM) - Manche', 'ddt', '50', '28', '130008170', '00016'),
        ('Direction départementale des territoires (DDT) - Marne', 'ddt', '51', '44', '130008527', '00017'),
        ('Direction départementale des territoires (DDT) - Haute-Marne', 'ddt', '52', '44', '130011323', '00016'),
        ('Direction départementale des territoires (DDT) - Mayenne', 'ddt', '53', '52', '130009806', '00014'),
        ('Direction départementale des territoires (DDT) - Meurthe-et-Moselle', 'ddt', '54', '44', '130010465', '00016'),
        ('Direction départementale des territoires (DDT) - Meuse', 'ddt', '55', '44', '130009954', '00012'),
        ('Direction départementale des territoires et de la mer (DDTM) - Morbihan', 'ddt', '56', '53', '130008675', '00188'),
        ('Direction départementale des territoires (DDT) - Moselle', 'ddt', '57', '44', '130010697', '00014'),
        ('Direction départementale des territoires (DDT) - Nièvre', 'ddt', '58', '27', '130010572', '00068'),
        ('Direction départementale des territoires et de la mer (DDTM) - Nord', 'ddt', '59', '32', '130009970', '00158'),
        ('Direction départementale des territoires (DDT) - Oise', 'ddt', '60', '32', '130010853', '00013'),
        ('Direction départementale des territoires (DDT) - Orne', 'ddt', '61', '28', '130010788', '00011'),
        ('Direction départementale des territoires et de la mer (DDTM) - Pas-de-Calais', 'ddt', '62', '32', '130010366', '00016'),
        ('Direction départementale des territoires (DDT) - Puy-de-Dôme', 'ddt', '63', '84', '130008147', '00063'),
        ('Direction départementale des territoires et de la mer (DDTM) - Pyrénées-Atlantiques', 'ddt', '64', '75', '130011570', '00012'),
        ('Direction départementale des territoires (DDT) - Hautes-Pyrénées', 'ddt', '65', '76', '130008931', '00011'),
        ('Direction départementale des territoires et de la mer (DDTM) - Pyrénées-Orientales', 'ddt', '66', '76', '130009095', '00014'),
        ('Direction départementale des territoires (DDT) - Bas-Rhin', 'ddt', '67', '44', '130010218', '00019'),
        ('Direction départementale des territoires (DDT) - Haut-Rhin', 'ddt', '68', '44', '130011083', '00016'),
        ('Direction départementale des territoires (DDT) - Rhône', 'ddt', '69', '84', '130008493', '00020'),
        ('Direction départementale des territoires (DDT) - Haute-Saône', 'ddt', '70', '27', '130008329', '00018'),
        ('Direction départementale des territoires (DDT) - Saône-et-Loire', 'ddt', '71', '27', '130010739', '00014'),
        ('Direction départementale des territoires (DDT) - Sarthe', 'ddt', '72', '52', '130009434', '00023'),
        ('Direction départementale des territoires (DDT) - Savoie', 'ddt', '73', '84', '130008246', '00014'),
        ('Direction départementale des territoires (DDT) - Haute-Savoie', 'ddt', '74', '84', '130009764', '00015'),
        ('Direction départementale des territoires et de la mer (DDTM) - Seine-Maritime', 'ddt', '76', '28', '130008154', '00010'),
        ('Direction départementale des territoires (DDT) - Seine-et-Marne', 'ddt', '77', '11', '130012339', '00011'),
        ('Direction départementale des territoires (DDT) - Yvelines', 'ddt', '78', '11', '130012073', '00016'),
        ('Direction départementale des territoires (DDT) - Deux-Sèvres', 'ddt', '79', '75', '130009616', '00017'),
        ('Direction départementale des territoires et de la mer (DDTM) - Somme', 'ddt', '80', '32', '130010846', '00025'),
        ('Direction départementale des territoires (DDT) - Tarn', 'ddt', '81', '76', '130008188', '00018'),
        ('Direction départementale des territoires (DDT) - Tarn-et-Garonne', 'ddt', '82', '76', '130011224', '00016'),
        ('Direction départementale des territoires et de la mer (DDTM) - Var', 'ddt', '83', '93', '130011026', '00015'),
        ('Direction départementale des territoires (DDT) - Vaucluse', 'ddt', '84', '93', '130011398', '00018'),
        ('Direction départementale des territoires et de la mer (DDTM) - Vendée', 'ddt', '85', '52', '130009111', '00019'),
        ('Direction départementale des territoires (DDT) - Vienne', 'ddt', '86', '75', '130009483', '00012'),
        ('Direction départementale des territoires (DDT) - Haute-Vienne', 'ddt', '87', '75', '130008501', '00012'),
        ('Direction départementale des territoires (DDT) - Vosges', 'ddt', '88', '44', '130008592', '00011'),
        ('Direction départementale des territoires (DDT) - Yonne', 'ddt', '89', '27', '130009400', '00016'),
        ('Direction départementale des territoires (DDT) - Territoire de Belfort', 'ddt', '90', '27', '130011331', '00019'),
        ('Direction départementale des territoires (DDT) - Essonne', 'ddt', '91', '11', '130012107', '00012'),
        ('Direction départementale des territoires (DDT) - Val-d''Oise', 'ddt', '95', '11', '130012115', '00015')
) as v (nom, type, departement_code, region_code, siren, nic)
where exists (select 1 from collectivite)
on conflict (type, departement_code) where type = 'ddt'
do update set siren       = excluded.siren,
              nic         = excluded.nic,
              region_code = excluded.region_code;

-- Les DR ADEME, appariées sur la région. Les dix-huit partagent le SIREN 385290309
-- de l'ADEME : seul le NIC les distingue, et c'est ce qui rendra possible le
-- rattachement automatique par ProConnect. La direction Océan Indien couvre deux
-- régions (La Réunion et Mayotte) : deux lignes, même nom et même SIRET, ce que
-- l'index autorise puisqu'il ne porte que sur la région.
insert into collectivite (nom, type, region_code, siren, nic)
select v.nom, v.type, v.region_code, v.siren, v.nic
from (values
        ('Direction Régionale (DR) Ademe - Guadeloupe', 'dr_ademe', '01', '385290309', '00389'),
        ('Direction Régionale (DR) Ademe - Martinique', 'dr_ademe', '02', '385290309', '00595'),
        ('Direction Régionale (DR) Ademe - Guyane', 'dr_ademe', '03', '385290309', '00538'),
        ('Direction Régionale (DR) Ademe - Océan Indien', 'dr_ademe', '04', '385290309', '00397'),
        ('Direction Régionale (DR) Ademe - Océan Indien', 'dr_ademe', '06', '385290309', '00397'),
        ('Direction Régionale (DR) Ademe - Île-de-France', 'dr_ademe', '11', '385290309', '00199'),
        ('Direction Régionale (DR) Ademe - Centre-Val de Loire', 'dr_ademe', '24', '385290309', '00579'),
        ('Direction Régionale (DR) Ademe - Bourgogne-Franche-Comté', 'dr_ademe', '27', '385290309', '00520'),
        ('Direction Régionale (DR) Ademe - Normandie', 'dr_ademe', '28', '385290309', '00314'),
        ('Direction Régionale (DR) Ademe - Hauts-de-France', 'dr_ademe', '32', '385290309', '00561'),
        ('Direction Régionale (DR) Ademe - Grand Est', 'dr_ademe', '44', '385290309', '00611'),
        ('Direction Régionale (DR) Ademe - Pays de la Loire', 'dr_ademe', '52', '385290309', '00686'),
        ('Direction Régionale (DR) Ademe - Bretagne', 'dr_ademe', '53', '385290309', '00546'),
        ('Direction Régionale (DR) Ademe - Nouvelle-Aquitaine', 'dr_ademe', '75', '385290309', '00496'),
        ('Direction Régionale (DR) Ademe - Occitanie', 'dr_ademe', '76', '385290309', '00603'),
        ('Direction Régionale (DR) Ademe - Auvergne-Rhône-Alpes', 'dr_ademe', '84', '385290309', '00371'),
        ('Direction Régionale (DR) Ademe - Provence-Alpes-Côte d''Azur', 'dr_ademe', '93', '385290309', '00629'),
        ('Direction Régionale (DR) Ademe - Corse', 'dr_ademe', '94', '385290309', '00504')
) as v (nom, type, region_code, siren, nic)
where exists (select 1 from collectivite)
on conflict (type, region_code) where type = 'dr_ademe'
do update set siren = excluded.siren,
              nic   = excluded.nic;

-- Adoption des lignes antérieures à l'import. `service_national` est la seule
-- famille appariée sur le nom : une ligne posée avant cet import sous une forme
-- courte — le « DGEC » du seed de développement — ne serait pas reconnue sous sa
-- dénomination officielle, et l'insert qui suit en créerait une seconde. On
-- l'adopte plutôt, ce qui vaut aussi sur une base déjà peuplée où le seed ne
-- repasse jamais.
--
-- `siren is null` borne l'adoption aux lignes que l'import n'a pas encore
-- touchées : un service déjà identifié au répertoire SIRENE n'est jamais renommé.
-- Les noms antérieurs sont déclarés dans la colonne `nom_anterieur` de
-- service-national.csv.
update collectivite
set nom   = v.nom,
    siren = v.siren,
    nic   = v.nic
from (values
        ('Direction Générale de l''Énergie et du climat (DGEC)', '120087010', '00068', 'DGEC')
) as v (nom, siren, nic, nom_anterieur)
where type = 'service_national'
  and collectivite.nom = v.nom_anterieur
  and collectivite.siren is null;

-- Les services nationaux. `service_national` est une famille, pas un service : la
-- DGEC et l'ADEME aujourd'hui, d'autres organes ensuite. Aucune unicité en base —
-- c'est le défaut de code géographique qui fait le périmètre national — et donc
-- pas de cible pour un `on conflict` : l'appariement se fait sur le nom, faute
-- d'autre clé stable une fois le territoire exclu.
insert into collectivite (nom, type, siren, nic)
select v.nom, 'service_national', v.siren, v.nic
from (values
        ('ADEME', '385290309', '00454'),
        ('Direction Générale de l''Énergie et du climat (DGEC)', '120087010', '00068')
) as v (nom, siren, nic)
where exists (select 1 from collectivite)
  and not exists (
    select 1 from collectivite
    where type = 'service_national' and nom = v.nom
);

-- Les conseils régionaux existent déjà comme collectivités de type `region`,
-- créées depuis `imports.region`, mais sans SIREN — départements et régions
-- n'étaient couverts par aucun import. On ne fait que le renseigner : jamais de
-- création, jamais de renommage.
--
-- Comme les blocs précédents, cet `update` ne rencontre rien au moment des
-- migrations sur une base neuve : les régions n'arrivent qu'avec
-- `06-complete_collectivite_with_import.sql`. Le piège est connu —
-- `collectivite/code_siren_commune` portait un `update` qui n'a jamais rien
-- rencontré, et les communes sont restées sans SIREN pendant des mois. Ici le
-- seed rejoue le même corps derrière, donc rien ne se perd.
update collectivite
set siren = v.siren,
    nic   = v.nic
from (values
        ('01', '239710015', '00029'),
        ('02', '200055507', '00012'),
        ('03', '200052678', '00014'),
        ('04', '239740012', '00012'),
        ('06', '229850003', '00018'),
        ('11', '237500079', '00312'),
        ('24', '234500023', '00028'),
        ('27', '200053726', '00028'),
        ('28', '200053403', '00057'),
        ('32', '200053742', '00017'),
        ('44', '200052264', '00013'),
        ('52', '234400034', '00026'),
        ('53', '233500016', '00040'),
        ('75', '200053759', '00011'),
        ('76', '200053791', '00014'),
        ('84', '200053767', '00014'),
        ('93', '231300021', '00012'),
        ('94', '200076958', '00012')
) as v (region_code, siren, nic)
where type = 'region'
  and collectivite.region_code = v.region_code
  and (collectivite.siren, collectivite.nic) is distinct from (v.siren, v.nic);

commit;
