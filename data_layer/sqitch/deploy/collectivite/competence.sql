-- Deploy tet:collectivite/competence to pg

BEGIN;

create table banatic_competence
(
    code integer primary key,
    nom  text not null
);

alter table banatic_competence
    enable row level security;
create policy allow_read_for_all on banatic_competence using (true);

insert into banatic_competence (code, nom)
values  (1010,'Hydraulique'),
        (1502,'Eau (Traitement, Adduction, Distribution)'),
        (1540,'Autres actions environnementales'),
        (4505,'Schéma de cohérence territoriale (SCOT)'),
        (4515,'Plans locaux d''urbanisme'),
        (4531,'Transport scolaire'),
        (4532,'Organisation des transports non urbains'),
        (4550,'Plans de déplacement urbains'),
        (4560,'Délivrance des autorisations d''occupation du sol (Permis de construire...)'),
        (5005,'Création, aménagement, entretien de la voirie'),
        (5015,'Parcs de stationnement'),
        (5505,'Programme local de l''habitat'),
        (5515,'Politique du logement social'),
        (5535,'Opération programmée d''amélioration de l''habitat (OPAH)'),
        (5550,'Actions de réhabilitation et résorption de l''habitat insalubre'),
        (7020,'Éclairage public'),
        (7025,'Pistes cyclables'),
        (1545,'Autorité concessionnaire de l''État pour les plages, dans les conditions prévues à l''article L. 2124-4 du code général de la propriété des personnes publiques'),
        (1550,'Création et entretien des infrastructures de charge nécessaires à l''usage des véhicules électriques ou hybrides rechargeables, en application de l''article L. 2224-37 du CGCT'),
        (1555,'Elaboration et adoption du plan climat-air-énergie territorial en application de l''article L. 229-26 du code de l''environnement'),
        (1560,'Contribution à la transition énergétique'),
        (4016,'Lycées et collèges'),
        (1004,'Concession de la distribution publique d''électricité et de gaz'),
        (1510,'Collecte et traitement des déchets des ménages et déchets assimilés'),
        (1525,'Lutte contre la pollution de l''air'),
        (5210,'Promotion du tourisme dont la création d''offices de tourisme'),
        (5525,'Action et aide financière en faveur du logement social'),
        (5530,'Action en faveur du logement des personnes défavorisées'),
        (1020,'Création, aménagement, entretien et gestion des réseaux de chaleur ou de froid urbains'),
        (3005,'Elaboration du diagnostic du territoire et définition des orientations du contrat de ville ; animation et coordination des dispositifs contractuels de développement urbain, de développement local et d''insertion économique et sociale ainsi que des dispositifs locaux de prévention de la délinquance ; programmes d''actions définis dans le contrat de ville'),
        (3505,'Actions de développement économique dans les conditions prévues à l''article L. 4251-17 ; création, aménagement, entretien et gestion de zones d''activité industrielle, commerciale, tertiaire, artisanale, touristique, portuaire ou aéroportuaire ; politique locale du commerce et soutien aux activités commerciales'),
        (1528,'GEMAPI : Aménagement d''un bassin ou d''une fraction de bassin hydrographique'),
        (1529,'GEMAPI : Entretien et aménagement d''un cours d''eau, canal, lac ou plan d''eau'),
        (1531,'GEMAPI : Défense contre les inondations et contre la mer'),
        (1532,'GEMAPI : Protection et restauration des sites, des écosystèmes aquatiques, des zones humides et des formations boisées riveraines'),
        (1533,'Gestion des eaux pluviales urbaines'),
        (1534,'Maîtrise des eaux pluviales et de ruissellement ou la lutte contre l''érosion des sols'),
        (1505,'Assainissement collectif'),
        (1507,'Assainissement non collectif'),
        (1025,'Soutien aux actions de maîtrise de la demande d''énergie (MDE)'),
        (9920,'Acquisition en commun de matériel');

create table collectivite_banatic_competence
(
    collectivite_id integer references collectivite       not null,
    competence_code integer references banatic_competence not null,
    primary key (collectivite_id, competence_code)
);

alter table collectivite_banatic_competence
    enable row level security;
create policy allow_read_for_all on collectivite_banatic_competence using (true);

COMMIT;
