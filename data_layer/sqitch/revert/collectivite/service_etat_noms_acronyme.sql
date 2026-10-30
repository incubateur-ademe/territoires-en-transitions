-- Revert tet:collectivite/service_etat_noms_acronyme from pg

BEGIN;

update collectivite
set nom = v.nom
from (values
    ('01', 'Direction de l''Environnement, de l''Aménagement et du Logement Guadeloupe (DEAL)'),
    ('02', 'Direction de l''Environnement, de l''Aménagement et du Logement Martinique (DEAL)'),
    ('03', 'Direction Générale des Territoires et de la Mer (DGTM)'),
    ('04', 'Direction de l''Environnement, de l''Aménagement et du Logement La Réunion (DEAL)'),
    ('06', 'Direction de l''Environnement, de l''Aménagement, du Logement et de la Mer de Mayotte (DEALM)'),
    ('11', 'Direction Régionale et interdépartementale de l''environnement, de l''aménagement et des transports (DRIEAT) - Île-de-France'),
    ('24', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Centre-Val de Loire (DREAL)'),
    ('27', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Bourgogne-Franche-Comté (DREAL)'),
    ('28', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Normandie (DREAL)'),
    ('32', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Hauts-de-France (DREAL)'),
    ('44', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Grand Est (DREAL)'),
    ('52', 'DREAL Pays de la Loire'),
    ('53', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Bretagne (DREAL)'),
    ('75', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Nouvelle-Aquitaine (DREAL)'),
    ('76', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Occitanie (DREAL)'),
    ('84', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Auvergne-Rhône-Alpes (DREAL)'),
    ('93', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Provence-Alpes-Côte d''Azur (DREAL)'),
    ('94', 'Direction Régionale de l''Environnement, de l''Aménagement et du Logement Corse (DREAL)')
) as v (region_code, nom)
where collectivite.type = 'dreal'
  and collectivite.region_code = v.region_code;

COMMIT;
