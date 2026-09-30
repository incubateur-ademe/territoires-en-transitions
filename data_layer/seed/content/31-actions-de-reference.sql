\set ON_ERROR_STOP on

begin;

insert into action_de_reference (titre, description, levier, categorie)
values ('Accompagner le remplacement des chaudières fioul des ménages', 'Orienter les ménages vers les aides à la rénovation et au changement de chauffage', 'chaudieres_fioul_renovation_residentiel', 'financement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Lancer une campagne de rénovation des maisons chauffées au gaz', 'Proposer un parcours de rénovation globale avec un conseiller France Rénov''', 'chaudieres_gaz_renovation_residentiel', 'sensibilisation');
insert into action_de_reference (titre, description, levier, categorie)
values ('Organiser des défis familles à énergie positive', 'Mobiliser les foyers volontaires autour des écogestes et du suivi de leur consommation', 'sobriete_batiments_residentiel', 'sensibilisation');
insert into action_de_reference (titre, description, levier, categorie)
values ('Remplacer les chaudières fioul des bâtiments communaux', 'Programmer le remplacement par des pompes à chaleur ou un raccordement au réseau de chaleur', 'chaudiere_fioul_tertiaire', 'exemplarite');
insert into action_de_reference (titre, description, levier, categorie)
values ('Planifier la sortie du gaz dans le patrimoine public', 'Établir un calendrier de substitution des chaudières gaz des équipements publics', 'chaudiere_gaz_tertiaire', 'planification');
insert into action_de_reference (titre, description, levier, categorie)
values ('Réaliser un schéma directeur immobilier et énergétique', 'Hiérarchiser les travaux d''isolation du patrimoine tertiaire public', 'sobriete_isolation_batiments_tertiaire', 'planification');
insert into action_de_reference (titre, description, levier, categorie)
values ('Déployer des tiers-lieux de télétravail', 'Réduire les trajets domicile-travail en ouvrant des espaces de travail partagés', 'reduction_deplacements', 'amenagement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Créer des aires de covoiturage aux entrées de ville', 'Aménager des points de rencontre sécurisés et signalés pour les covoitureurs', 'covoiturage', 'amenagement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Élaborer un schéma directeur cyclable', 'Définir un réseau continu d''itinéraires cyclables et son calendrier de réalisation', 'velo_transport_commun', 'planification');
insert into action_de_reference (titre, description, levier, categorie)
values ('Installer des bornes de recharge sur l''espace public', 'Mailler le territoire en points de recharge pour les véhicules électriques', 'vehicules_electriques', 'amenagement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Convertir la flotte de bus au biogaz ou à l''électrique', 'Renouveler les bus urbains et les cars interurbains par des motorisations décarbonées', 'bus_cars_decarbones', 'financement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Organiser la logistique urbaine du dernier kilomètre', 'Créer un espace de logistique urbaine et encourager la livraison à vélo cargo', 'efficacite_sobriete_logistique', 'gouvernance');
insert into action_de_reference (titre, description, levier, categorie)
values ('Accompagner les éleveurs vers des pratiques bas carbone', 'Financer des diagnostics carbone d''exploitation et un plan d''action par élevage', 'elevage_durable', 'financement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Planter et entretenir des haies bocagères', 'Soutenir la plantation de haies et leur gestion durable avec les agriculteurs', 'gestion_haies', 'financement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Adopter une trajectoire de zéro artificialisation nette', 'Inscrire la sobriété foncière dans le document d''urbanisme et suivre la consommation d''espaces', 'sobriete_fonciere', 'planification');
insert into action_de_reference (titre, description, levier, categorie)
values ('Généraliser le tri à la source des biodéchets', 'Distribuer des composteurs et organiser la collecte séparée des biodéchets', 'prevention_dechets', 'amenagement');
insert into action_de_reference (titre, description, levier, categorie)
values ('Ouvrir une recyclerie sur le territoire', 'Donner une seconde vie aux objets et aux matériaux collectés en déchèterie', 'valorisation_matiere_dechets', 'gouvernance');
insert into action_de_reference (titre, description, levier, categorie)
values ('Équiper les toitures publiques de panneaux photovoltaïques', 'Recenser les toitures favorables et lancer une première tranche d''installations', 'electricite_renouvelable', 'exemplarite');
insert into action_de_reference (titre, description, levier, categorie)
values ('Créer une société citoyenne de production d''énergie', 'Associer habitants et collectivité au financement de projets renouvelables locaux', 'electricite_renouvelable', 'gouvernance');
insert into action_de_reference (titre, description, levier, categorie)
values ('Étudier l''opportunité d''une unité de méthanisation territoriale', 'Évaluer les gisements agricoles et les débouchés du biogaz produit', 'biogaz', 'planification');
insert into action_de_reference (titre, description, levier, categorie)
values ('Étendre le réseau de chaleur alimenté par la biomasse', 'Raccorder de nouveaux quartiers à un réseau de chaleur à majorité renouvelable', 'reseaux_chaleur_decarbones', 'amenagement');

commit;
