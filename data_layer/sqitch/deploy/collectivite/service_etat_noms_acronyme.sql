-- Deploy tet:collectivite/service_etat_noms_acronyme to pg
-- requires: collectivite/service_etat_import

BEGIN;

update collectivite
set nom = v.nom
from (values
    ('01', 'DEAL Guadeloupe (Direction de l''Environnement, de l''Aménagement et du Logement)'),
    ('02', 'DEAL Martinique (Direction de l''Environnement, de l''Aménagement et du Logement)'),
    ('03', 'DGTM Guyane (Direction Générale des Territoires et de la Mer)'),
    ('04', 'DEAL La Réunion (Direction de l''Environnement, de l''Aménagement et du Logement)'),
    ('06', 'DEALM Mayotte (Direction de l''Environnement, de l''Aménagement, du Logement et de la Mer)'),
    ('11', 'DRIEAT Île-de-France (Direction Régionale et Interdépartementale de l''Environnement, de l''Aménagement et des Transports)'),
    ('24', 'DREAL Centre-Val de Loire (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('27', 'DREAL Bourgogne-Franche-Comté (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('28', 'DREAL Normandie (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('32', 'DREAL Hauts-de-France (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('44', 'DREAL Grand Est (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('52', 'DREAL Pays de la Loire (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('53', 'DREAL Bretagne (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('75', 'DREAL Nouvelle-Aquitaine (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('76', 'DREAL Occitanie (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('84', 'DREAL Auvergne-Rhône-Alpes (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('93', 'DREAL Provence-Alpes-Côte d''Azur (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)'),
    ('94', 'DREAL Corse (Direction Régionale de l''Environnement, de l''Aménagement et du Logement)')
) as v (region_code, nom)
where collectivite.type = 'dreal'
  and collectivite.region_code = v.region_code;

COMMIT;
