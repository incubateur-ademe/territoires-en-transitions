--
-- PostgreSQL database dump
--

\restrict YDaUJp4bwQ2HXwA7iE8e5Mon8peSNseVZrDy6BhURPia4ue9xY4oBWbu7n052FU

-- Dumped from database version 15.8
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: banatic_2025_competence; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.banatic_2025_competence VALUES (1005, 'Concession de la distribution publique d''électricité');
INSERT INTO public.banatic_2025_competence VALUES (1010, 'Concession de la distribution publique de gaz');
INSERT INTO public.banatic_2025_competence VALUES (1015, 'Création, aménagement, entretien et gestion des réseaux de chaleur ou de froid urbains');
INSERT INTO public.banatic_2025_competence VALUES (1020, 'Soutien aux actions de maîtrise d''énergie');
INSERT INTO public.banatic_2025_competence VALUES (1025, 'Création et entretien des infrastructures de charge nécessaires à l''usage des véhicules électriques ou hybrides rechargeables, en application de l''article L2224-37 du CGCT');
INSERT INTO public.banatic_2025_competence VALUES (1030, 'Eclairage public');
INSERT INTO public.banatic_2025_competence VALUES (1035, 'Installation d''hydroélectricité, d''énergies renouvelables et autres installations visées à l''article L2224-32 du CGCT');
INSERT INTO public.banatic_2025_competence VALUES (1040, 'Installation de production d''électricité de proximité au sens de l''article L2224-33 du CGCT');
INSERT INTO public.banatic_2025_competence VALUES (1045, 'Contribution à la transition énergétique');
INSERT INTO public.banatic_2025_competence VALUES (1505, 'Eau (production, traitement, stockage, transport, distribution)');
INSERT INTO public.banatic_2025_competence VALUES (1510, 'Assainissement collectif des eaux usées');
INSERT INTO public.banatic_2025_competence VALUES (1515, 'Assainissement non collectif des eaux usées');
INSERT INTO public.banatic_2025_competence VALUES (1520, 'Gestion des eaux pluviales urbaines');
INSERT INTO public.banatic_2025_competence VALUES (2000, 'Mise en place d''une zone à faible émissions mobilité (ZFE-m) (L. 2213-4-1 du CGCT)');
INSERT INTO public.banatic_2025_competence VALUES (2005, 'GEMAPI : Aménagement d''un bassin ou d''une fraction de bassin hydrographique (L. 211-7 1° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2010, 'GEMAPI : Entretien et aménagement d''un cours d''eau, canal, lac ou plan d''eau (L. 211-7 2° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2015, 'GEMAPI : Défense contre les inondations et contre la mer (L. 211-7 5° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2020, 'GEMAPI : Protection et restauration des sites, des écosystèmes aquatiques, des zones humides et des formations boisées riveraines (L. 211-7 8° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2025, 'Approvisionnement en eau (L. 211-7-3° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2030, 'Maîtrise des eaux pluviales et de ruissellement ou la lutte contre l''érosion des sols (L. 211-7 4° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2035, 'Lutte contre la pollution (L.211-7-6° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2040, 'Protection et la conservation des eaux superficielles et souterraines (L.211-7-7° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2045, 'Aménagements hydrauliques concourant à la sécurité civile (L. 211-7 9° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2050, 'Exploitation, entretien et aménagement d''ouvrages hydrauliques existants (L. 211-7 10° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2055, 'Mise en place et exploitation de dispositifs de surveillance de la ressource en eau et des milieux aquatiques (L. 211-7 11 ° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2060, 'Animation et concertation dans les domaines de la prévention du risque d''inondation ainsi que de la gestion et de la protection de la ressource en eau et des milieux aquatiques dans un sous-bassin ou un groupement de sous-bassins, ou dans un système aquifère, correspondant à une unité hydrographique (L.211-7-12° du code de l''environnement)');
INSERT INTO public.banatic_2025_competence VALUES (2065, 'Aménagement et gestion d''un parc naturel régional');
INSERT INTO public.banatic_2025_competence VALUES (2070, 'Autorité concessionnaire de l''Etat pour les plages, dans les conditions prévues à l''article L. 2124-4 du code général de la propriété des personnes publiques.');
INSERT INTO public.banatic_2025_competence VALUES (2075, 'Elaboration et adoption du plan climat-air-énergie territorial en application de l''article L. 229-26 du code de l''environnement');
INSERT INTO public.banatic_2025_competence VALUES (2080, 'Exercice de la compétence collecte des déchets ménagers et assimilés');
INSERT INTO public.banatic_2025_competence VALUES (2085, 'Exercice de la compétence traitement des déchets ménagers et assimilés');
INSERT INTO public.banatic_2025_competence VALUES (2090, 'Lutte contre les nuisances sonores');
INSERT INTO public.banatic_2025_competence VALUES (2095, 'Lutte contre la pollution de l''air');
INSERT INTO public.banatic_2025_competence VALUES (2500, 'Création, gestion, extension et translation des cimetières et sites cinéraires');
INSERT INTO public.banatic_2025_competence VALUES (2505, 'Création, gestion et extension des crématoriums');
INSERT INTO public.banatic_2025_competence VALUES (2510, 'Service extérieur de pompes funèbres (L. 2223-19 du CGCT)');
INSERT INTO public.banatic_2025_competence VALUES (3000, 'Activités sanitaires');
INSERT INTO public.banatic_2025_competence VALUES (3005, 'Maisons de santé pluridisciplinaires');
INSERT INTO public.banatic_2025_competence VALUES (3010, 'Accueil du jeune enfant : Crèches');
INSERT INTO public.banatic_2025_competence VALUES (3015, 'Accueil du jeune enfant : Relais petite enfance');
INSERT INTO public.banatic_2025_competence VALUES (3020, 'Accueil du jeune enfant : Maisons d''assistants maternels');
INSERT INTO public.banatic_2025_competence VALUES (3025, 'Centre intercommunal d''action sociale');
INSERT INTO public.banatic_2025_competence VALUES (3030, 'Aide sociale');
INSERT INTO public.banatic_2025_competence VALUES (3035, 'Action sociale communale');
INSERT INTO public.banatic_2025_competence VALUES (3040, 'Action sociale départementale');
INSERT INTO public.banatic_2025_competence VALUES (3045, 'Adoption, adaptation et mise en oeuvre du programme départemental d''insertion');
INSERT INTO public.banatic_2025_competence VALUES (3050, 'Aide départementale aux jeunes en difficulté');
INSERT INTO public.banatic_2025_competence VALUES (3055, 'Action départementale de prévention spécialisée auprès des jeunes et des familles en difficulté ou en rupture avec leur milieu');
INSERT INTO public.banatic_2025_competence VALUES (3060, 'Action départementale Personnes âgées');
INSERT INTO public.banatic_2025_competence VALUES (3500, 'Elaboration du diagnostic du territoire et définition des orientations du contrat de ville, animation et coordination des dispositifs contractuels de développement urbain, de développement local et d''insertion économique et sociale ainsi que des dispositifs locaux de prévention de la délinquance ; programmes d''actions définis dans le contrat de ville');
INSERT INTO public.banatic_2025_competence VALUES (4000, 'Actions de développement économique dans les conditions prévues à l''article L. 4251-17 ; politique locale du commerce et soutien aux activités commerciales');
INSERT INTO public.banatic_2025_competence VALUES (4005, 'Création, aménagement, entretien et gestion de zones d''activité industrielle, commerciale, tertiaire, artisanale, touristique, portuaire ou aéroportuaire');
INSERT INTO public.banatic_2025_competence VALUES (4010, 'Compétences de la région en matière de développement économique en application des articles L. 4211-1 et L. 4253-1 à L4253-3');
INSERT INTO public.banatic_2025_competence VALUES (4500, 'Promotion du tourisme dont la création d''offices de tourisme et animation touristique');
INSERT INTO public.banatic_2025_competence VALUES (4505, 'Compétences touristiques du département');
INSERT INTO public.banatic_2025_competence VALUES (4510, 'Gestion des équipements touristiques');
INSERT INTO public.banatic_2025_competence VALUES (4515, 'Organisation d''un service de remontées mécaniques au sens de l''article L. 342-9 du code du tourisme');
INSERT INTO public.banatic_2025_competence VALUES (4520, 'Thermalisme');
INSERT INTO public.banatic_2025_competence VALUES (5000, 'Construction, aménagement, entretien et fonctionnement d''équipements culturels et sportifs');
INSERT INTO public.banatic_2025_competence VALUES (5005, 'Compétences du département en matière de culture, construction, exploitation et entretien des équipements et infrastructures destinés à la pratique du sport');
INSERT INTO public.banatic_2025_competence VALUES (5010, 'Construction, entretien et fonctionnement d''équipements de l''enseignement préélémentaire et élémentaire');
INSERT INTO public.banatic_2025_competence VALUES (5015, 'Activités périscolaires (activités culturelles, sportives, artistiques complémentaires aux enseignements scolaires)');
INSERT INTO public.banatic_2025_competence VALUES (5020, 'Construction, reconstruction, aménagement, entretien et fonctionnement des lycées (accueil, restauration, hébergement, entretien général et technique)');
INSERT INTO public.banatic_2025_competence VALUES (5025, 'Construction, reconstruction, aménagement, entretien et fonctionnement des collèges (accueil, restauration, hébergement, entretien général et technique)');
INSERT INTO public.banatic_2025_competence VALUES (5030, 'Programme de soutien et d''aides aux établissements d''enseignement supérieur et de recherche et aux programmes de recherche');
INSERT INTO public.banatic_2025_competence VALUES (5035, 'Activités culturelles ou socioculturelles');
INSERT INTO public.banatic_2025_competence VALUES (5040, 'Activités sportives');
INSERT INTO public.banatic_2025_competence VALUES (5045, 'Restauration scolaire');
INSERT INTO public.banatic_2025_competence VALUES (5050, 'Garderie périscolaire');
INSERT INTO public.banatic_2025_competence VALUES (5500, 'Schéma de cohérence territoriale (SCOT) (Art. L. 143-16 code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (5505, 'Schéma de secteur (Art. L. 173-1 du code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (5510, 'Plan local d''urbanisme et document d''urbanisme en tenant lieu (Art. L. 153-1 du code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (5515, 'Définition, création et réalisation d''opérations d''aménagement d''intérêt communautaire au sens de l''article L.300-1 du code de l''urbanisme (les ZAC entrent dans cette catégorie)');
INSERT INTO public.banatic_2025_competence VALUES (5520, 'Constitution de réserves foncières (articles L.210-1 et L.221-1 du code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (5525, 'Droit de préemption urbain (article L.211-2 du code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (5530, 'Délivrance des autorisations d''occupation du sol (Permis de construire...) (article L.422-3 du code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (5535, 'Actions de valorisation du patrimoine naturel et paysager');
INSERT INTO public.banatic_2025_competence VALUES (5540, 'Instruction des autorisations d''occupation du sol (article L.423-1 et articles R.*423-14 et suivants du code de l''urbanisme)');
INSERT INTO public.banatic_2025_competence VALUES (6000, 'Organisation de services réguliers / à la demande de transports publics de personnes, des services de mobilité solidaire, organisation ou contribution au développement des services relatifs aux mobilités actives définies à l''article L. 1271-1 du code des transports, organisation ou contribution au développement des services relatifs aux usages partagés des véhicules terrestres à moteur.');
INSERT INTO public.banatic_2025_competence VALUES (6005, 'Organisation de transports scolaires');
INSERT INTO public.banatic_2025_competence VALUES (6010, 'Transports publics non urbains (L. 3111-1 du code des transports)');
INSERT INTO public.banatic_2025_competence VALUES (6015, 'Gestion de ports de plaisance ou de ports maritimes de commerce (L. 5314-4 du code des transports)');
INSERT INTO public.banatic_2025_competence VALUES (6020, 'Exploitation d''aérodrome dont organisation de services aériens de transport public (L. 6321-2 du code des transports)');
INSERT INTO public.banatic_2025_competence VALUES (6025, 'Participation à la gouvernance et à l''aménagement des gares situées sur le territoire métropolitain');
INSERT INTO public.banatic_2025_competence VALUES (6030, 'Voies navigables (D. 4314-3 du code des transports)');
INSERT INTO public.banatic_2025_competence VALUES (6035, 'Mise en place d''itinéraires cyclables');
INSERT INTO public.banatic_2025_competence VALUES (6040, 'Création, aménagement, entretien de la voirie communale');
INSERT INTO public.banatic_2025_competence VALUES (6045, 'Signalisation, abris de voyageurs, parcs et aires de stationnement');
INSERT INTO public.banatic_2025_competence VALUES (6055, 'Conseil en mobilité destiné aux employeurs et aux gestionnaires d''activités générant des flux de déplacements importants');
INSERT INTO public.banatic_2025_competence VALUES (6060, 'Organisation ou contribution au développement des services de transport de marchandises et de logistique urbaine');
INSERT INTO public.banatic_2025_competence VALUES (6065, 'Syndicat de transport de type SRU');
INSERT INTO public.banatic_2025_competence VALUES (6070, 'Plans de mobilité');
INSERT INTO public.banatic_2025_competence VALUES (6075, 'Compétences départementales en matières de voirie');
INSERT INTO public.banatic_2025_competence VALUES (6500, 'Programme local de l''habitat');
INSERT INTO public.banatic_2025_competence VALUES (6505, 'Action et aide financière en faveur du logement social');
INSERT INTO public.banatic_2025_competence VALUES (6510, 'Action en faveur du logement des personnes défavorisées');
INSERT INTO public.banatic_2025_competence VALUES (6515, 'Opération programmée d''amélioration de l''habitat (OPAH)');
INSERT INTO public.banatic_2025_competence VALUES (6520, 'Amélioration du parc immobilier bâti');
INSERT INTO public.banatic_2025_competence VALUES (6525, 'Actions de réhabilitation et résorption de l''habitat insalubre');
INSERT INTO public.banatic_2025_competence VALUES (6530, 'Délégation des aides à la pierre - Compétences insécables (IV Art.L.301-5-1 CCH) - Etat');
INSERT INTO public.banatic_2025_competence VALUES (6535, 'Délégation des aides à la pierre - Compétences sécables (V Art.L.301-5-1 CCH) - Etat');
INSERT INTO public.banatic_2025_competence VALUES (7000, 'Aménagement, entretien et gestion des aires d''accueil des gens du voyage et des terrains familiaux locatifs');
INSERT INTO public.banatic_2025_competence VALUES (7500, 'Abattoirs publics');
INSERT INTO public.banatic_2025_competence VALUES (7505, 'Marchés d''intérêt national, halles, foires et marchés');
INSERT INTO public.banatic_2025_competence VALUES (7510, 'Contributions pour le financement du SDIS');
INSERT INTO public.banatic_2025_competence VALUES (7515, 'Préparation et réalisation des enquêtes de recensement de la population');
INSERT INTO public.banatic_2025_competence VALUES (7520, 'Centre de première intervention des services locaux d''incendie et de secours (L. 1424-36-4)');
INSERT INTO public.banatic_2025_competence VALUES (7525, 'Service public de défense extérieure contre l''incendie');
INSERT INTO public.banatic_2025_competence VALUES (7530, 'Réseaux et services locaux de communications électroniques d''initiative publique au sens de l''article L 1425-1 CGCT');
INSERT INTO public.banatic_2025_competence VALUES (7535, 'Maison France services');
INSERT INTO public.banatic_2025_competence VALUES (7540, 'Archéologie préventive');
INSERT INTO public.banatic_2025_competence VALUES (7545, 'Plan de mise en accessibilité');
INSERT INTO public.banatic_2025_competence VALUES (7550, 'Gestion des sentiers de randonnée');
INSERT INTO public.banatic_2025_competence VALUES (7555, 'Projet alimentaire territorial');
INSERT INTO public.banatic_2025_competence VALUES (7560, 'Lutte contre les nuisibles');
INSERT INTO public.banatic_2025_competence VALUES (7565, 'Fourrière automobile');
INSERT INTO public.banatic_2025_competence VALUES (7570, 'Fourrière animale');
INSERT INTO public.banatic_2025_competence VALUES (7575, 'Autres');


--
-- PostgreSQL database dump complete
--

\unrestrict YDaUJp4bwQ2HXwA7iE8e5Mon8peSNseVZrDy6BhURPia4ue9xY4oBWbu7n052FU

