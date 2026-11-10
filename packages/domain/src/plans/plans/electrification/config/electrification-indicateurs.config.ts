import type { ElectrificationFichesConfig } from './electrification-fiches.config';

/** Les codes Grist sont connus ; leur correspondance TeT reste à valider (ADR 0022). */
const pendingQuantitativeMapping = {
  type: 'quantitatif',
  validation: 'pending',
  identifiantReferentiel: null,
} as const;

export const electrificationIndicateurs: NonNullable<
  ElectrificationFichesConfig['indicateurs']
> = [
  // Part des résidences principales chauffées au fioul
  // Unité principale à préciser : la source indique "% et nb".
  {
    ...pendingQuantitativeMapping,
    code: '1-a',
    unite: null,
    periodicite: 'annuelle',
  },
  // Part des résidences principales chauffées au gaz de réseau
  // Unité principale à préciser : la source indique "% et nb".
  {
    ...pendingQuantitativeMapping,
    code: '1-b',
    unite: null,
    periodicite: 'annuelle',
  },
  // Part des résidences principales chauffées au gaz en bouteille ou en citerne
  // Unité principale à préciser : la source indique "% et nb".
  {
    ...pendingQuantitativeMapping,
    code: '1-c',
    unite: null,
    periodicite: 'annuelle',
  },
  // Consommation de gaz du secteur résidentiel
  {
    ...pendingQuantitativeMapping,
    code: '1-d',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre de points de livraison de gaz du secteur résidentiel
  {
    ...pendingQuantitativeMapping,
    code: '1-e',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de logements ciblés pour l'aller-vers
  {
    ...pendingQuantitativeMapping,
    code: '1.1.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de ménages repérés orientés vers l'espace conseil France Rénov'
  {
    ...pendingQuantitativeMapping,
    code: '1.2.1-a',
    unite: 'nb',
    periodicite: 'trimestrielle',
  },
  // Nombre de pompes à chaleur aidées en remplacement d'une chaudière fioul ou gaz
  {
    ...pendingQuantitativeMapping,
    code: '1.2.1-b',
    unite: 'nb',
    periodicite: 'trimestrielle',
  },
  // Nombre de foyers destinataires du courrier ou de l'article
  {
    ...pendingQuantitativeMapping,
    code: '1.2.1-c',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de permanences et de réunions d'information tenues
  {
    ...pendingQuantitativeMapping,
    code: '1.2.2-a',
    unite: 'nb',
    periodicite: 'trimestrielle',
  },
  // Nombre de visites de maisons organisées
  {
    ...pendingQuantitativeMapping,
    code: '1.2.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de foyers inscrits à l'achat groupé d'électricité
  {
    ...pendingQuantitativeMapping,
    code: '1.2.4-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de pompes à chaleur installées via un achat groupé en remplacement d'une chaudière fioul ou gaz
  {
    ...pendingQuantitativeMapping,
    code: '1.2.5-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de cuves retirées ou neutralisées avec l'appui de la collectivité
  {
    ...pendingQuantitativeMapping,
    code: '1.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Chaleur livrée par les réseaux de chaleur du territoire
  {
    ...pendingQuantitativeMapping,
    code: '1.5-a',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre de bâtiments raccordés aux réseaux de chaleur du territoire (points de livraison)
  {
    ...pendingQuantitativeMapping,
    code: '1.5.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de projets de création ou d'extension de réseau engagés (étude ou travaux)
  {
    ...pendingQuantitativeMapping,
    code: '1.5.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de logements sociaux chauffés au gaz (et au fioul, le cas échéant)
  {
    ...pendingQuantitativeMapping,
    code: '2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des logements sociaux du territoire dont le mode de chauffage est recensé
  {
    ...pendingQuantitativeMapping,
    code: '2.1.1-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de logements sociaux dans les résidences priorisées
  {
    ...pendingQuantitativeMapping,
    code: '2.1.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de bailleurs dont le plan stratégique de patrimoine a été revu dans l'année
  {
    ...pendingQuantitativeMapping,
    code: '2.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des logements sociaux couverts par un plan stratégique de patrimoine intégrant la sortie du gaz
  {
    ...pendingQuantitativeMapping,
    code: '2.2.1-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de bailleurs ayant signé une convention
  {
    ...pendingQuantitativeMapping,
    code: '2.2.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des logements sociaux détenus par des bailleurs ayant signé une convention
  {
    ...pendingQuantitativeMapping,
    code: '2.2.2-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de logements sociaux dont les travaux de sortie du gaz sont engagés
  {
    ...pendingQuantitativeMapping,
    code: '2.2.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Économie moyenne de charges de chauffage par logement traité
  {
    ...pendingQuantitativeMapping,
    code: '2.3.1-a',
    unite: '€/logement/an',
    periodicite: 'annuelle',
  },
  // Nombre de bâtiments publics chauffés au gaz ou au fioul
  {
    ...pendingQuantitativeMapping,
    code: '3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Consommation de gaz et de fioul des bâtiments publics
  {
    ...pendingQuantitativeMapping,
    code: '3-b',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre de bâtiments publics dont le mode de chauffage est inventorié
  {
    ...pendingQuantitativeMapping,
    code: '3.1.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part de la surface du patrimoine public dont le mode de chauffage est inventorié
  {
    ...pendingQuantitativeMapping,
    code: '3.1.1-b',
    unite: '% des m²',
    periodicite: 'annuelle',
  },
  // Nombre de bâtiments classés « remplacement direct possible »
  {
    ...pendingQuantitativeMapping,
    code: '3.1.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part de la surface du patrimoine public classée « remplacement direct possible »
  {
    ...pendingQuantitativeMapping,
    code: '3.1.2-b',
    unite: '% des m²',
    periodicite: 'annuelle',
  },
  // Nombre de bâtiments ayant fait l'objet d'une étude de géothermie
  {
    ...pendingQuantitativeMapping,
    code: '3.1.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part de la surface du patrimoine public ayant fait l'objet d'une étude de géothermie
  {
    ...pendingQuantitativeMapping,
    code: '3.1.3-b',
    unite: '% des m²',
    periodicite: 'annuelle',
  },
  // Nombre de remplacements de chaudières inscrits au plan pluriannuel d'investissement
  {
    ...pendingQuantitativeMapping,
    code: '3.1.4-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part de la surface du patrimoine public chauffé au fioul ou au gaz dont le remplacement est inscrit au plan pluriannuel d'investissement
  {
    ...pendingQuantitativeMapping,
    code: '3.1.4-b',
    unite: '% des m²',
    periodicite: 'annuelle',
  },
  // Nombre de remplacements de chaudières engagés (marché notifié ou travaux commencés)
  {
    ...pendingQuantitativeMapping,
    code: '3.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part de la surface du patrimoine public chauffé au fioul ou au gaz dont le remplacement est engagé
  {
    ...pendingQuantitativeMapping,
    code: '3.2.1-b',
    unite: '% des m²',
    periodicite: 'annuelle',
  },
  // Nombre d'agents formés
  {
    ...pendingQuantitativeMapping,
    code: '3.2.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des agents concernés formés
  {
    ...pendingQuantitativeMapping,
    code: '3.2.3-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Consommation annuelle d'énergie des bâtiments traités
  {
    ...pendingQuantitativeMapping,
    code: '3.2.4-a',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre d'opérations valorisées (visite, publication, présentation aux élus ou aux habitants)
  {
    ...pendingQuantitativeMapping,
    code: '3.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Longueur du réseau de distribution de gaz en service
  {
    ...pendingQuantitativeMapping,
    code: '4-a',
    unite: 'km',
    periodicite: 'annuelle',
  },
  // Nombre de points de livraison de gaz
  {
    ...pendingQuantitativeMapping,
    code: '4-b',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Montant des réinvestissements évités sur le réseau de gaz
  {
    ...pendingQuantitativeMapping,
    code: '4-c',
    unite: '€',
    periodicite: 'annuelle',
  },
  // Part des usagers des zones pré-identifiées dont la situation est connue
  {
    ...pendingQuantitativeMapping,
    code: '4.2.3-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Part du linéaire de réseau de gaz classé selon la méthodologie nationale
  {
    ...pendingQuantitativeMapping,
    code: '4.3.1-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Part des voitures électriques dans le parc de voitures particulières
  {
    ...pendingQuantitativeMapping,
    code: '5-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Part des voitures électriques dans les immatriculations de voitures neuves de l'année
  {
    ...pendingQuantitativeMapping,
    code: '5-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre d'événements d'information et d'essai organisés
  {
    ...pendingQuantitativeMapping,
    code: '5.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de personnes ayant essayé un véhicule électrique lors de ces événements
  {
    ...pendingQuantitativeMapping,
    code: '5.2.1-b',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de véhicules électriques partagés mis à disposition
  {
    ...pendingQuantitativeMapping,
    code: '5.2.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de contrats de leasing social signés par des ménages du territoire
  {
    ...pendingQuantitativeMapping,
    code: '5.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de garages engagés par convention ou charte
  {
    ...pendingQuantitativeMapping,
    code: '5.3.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des garages du territoire engagés par convention ou charte
  {
    ...pendingQuantitativeMapping,
    code: '5.3.3-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Part des véhicules électriques dans les acquisitions de l'année
  {
    ...pendingQuantitativeMapping,
    code: '5.4.1-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre d'employeurs signataires de la charte
  {
    ...pendingQuantitativeMapping,
    code: '5.5.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Salariés des employeurs signataires, rapportés à la population du territoire
  {
    ...pendingQuantitativeMapping,
    code: '5.5.1-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de points de recharge ouverts au public
  {
    ...pendingQuantitativeMapping,
    code: '6-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de points de recharge rapide (150 kW et plus) ouverts au public
  {
    ...pendingQuantitativeMapping,
    code: '6-b',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de points d'étape tenus avec Enedis et les opérateurs
  {
    ...pendingQuantitativeMapping,
    code: '6.1.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de points de recharge rapide (150 kW et plus) ouverts au public dans les lieux de passage
  {
    ...pendingQuantitativeMapping,
    code: '6.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de points de recharge publics financés par la collectivité
  {
    ...pendingQuantitativeMapping,
    code: '6.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'entreprises ayant signé une convention
  {
    ...pendingQuantitativeMapping,
    code: '6.3.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de conventions avec des bailleurs sociaux prévoyant l'équipement en bornes
  {
    ...pendingQuantitativeMapping,
    code: '6.3.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des logements sociaux couverts par une convention prévoyant l'équipement en bornes
  {
    ...pendingQuantitativeMapping,
    code: '6.3.3-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de copropriétés accompagnées
  {
    ...pendingQuantitativeMapping,
    code: '6.3.4-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des copropriétés du territoire accompagnées
  {
    ...pendingQuantitativeMapping,
    code: '6.3.4-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de sites identifiés pour la recharge des poids lourds
  {
    ...pendingQuantitativeMapping,
    code: '7-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Puissance moyenne des points de recharge prévus sur le ou les sites
  {
    ...pendingQuantitativeMapping,
    code: '7-b',
    unite: 'kW',
    periodicite: 'annuelle',
  },
  // Part des poids lourds électriques dans les immatriculations neuves de l'année
  {
    ...pendingQuantitativeMapping,
    code: '7-c',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de lettres d'intention recueillies auprès de transporteurs ou de chargeurs
  {
    ...pendingQuantitativeMapping,
    code: '7.1.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de dossiers de site constitués
  {
    ...pendingQuantitativeMapping,
    code: '7.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des autobus électriques dans le parc
  {
    ...pendingQuantitativeMapping,
    code: '8-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Part des autobus électriques dans les immatriculations neuves d'autobus
  {
    ...pendingQuantitativeMapping,
    code: '8-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de véhicules étudiés pour un rétrofit
  {
    ...pendingQuantitativeMapping,
    code: '8.2.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'autobus thermiques réaffectés ou cédés
  {
    ...pendingQuantitativeMapping,
    code: '8.2.5-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de dépôts dont la demande de raccordement est déposée auprès d'Enedis
  {
    ...pendingQuantitativeMapping,
    code: '8.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des dépôts dont la demande de raccordement est déposée auprès d'Enedis
  {
    ...pendingQuantitativeMapping,
    code: '8.3.1-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de points de recharge intermédiaires installés
  {
    ...pendingQuantitativeMapping,
    code: '8.3.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des contrats d'exploitation comportant une clause de formation
  {
    ...pendingQuantitativeMapping,
    code: '8.3.3-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre d'artisans accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '9-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des entreprises artisanales recensées qui sont accompagnées
  {
    ...pendingQuantitativeMapping,
    code: '9-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Consommation électrifiée par les équipements remplacés
  {
    ...pendingQuantitativeMapping,
    code: '9-c',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre d'entreprises artisanales recensées
  {
    ...pendingQuantitativeMapping,
    code: '9.1.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'artisans retenus pour un accompagnement
  {
    ...pendingQuantitativeMapping,
    code: '9.1.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'artisans entrés dans le parcours d'accompagnement
  {
    ...pendingQuantitativeMapping,
    code: '9.2.1-a',
    unite: 'nb',
    periodicite: 'trimestrielle',
  },
  // Nombre d'équipements acquis par commande groupée
  {
    ...pendingQuantitativeMapping,
    code: '9.2.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de marchés ou de contrats comportant une clause d'électrification
  {
    ...pendingQuantitativeMapping,
    code: '9.2.4-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de zones artisanales ayant fait l'objet d'une demande groupée auprès d'Enedis
  {
    ...pendingQuantitativeMapping,
    code: '9.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de locaux d'activité chauffés au fioul ou au gaz repérés
  {
    ...pendingQuantitativeMapping,
    code: '9.5.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'entreprises orientées vers une visite énergie pour leur chauffage
  {
    ...pendingQuantitativeMapping,
    code: '9.5.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des locaux d'activité repérés dont l'occupant a été orienté vers une visite énergie
  {
    ...pendingQuantitativeMapping,
    code: '9.5.2-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Part des véhicules utilitaires légers électriques dans le parc
  {
    ...pendingQuantitativeMapping,
    code: '9.6-a',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre d'artisans informés
  {
    ...pendingQuantitativeMapping,
    code: '9.6.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'essais de véhicules utilitaires électriques réalisés
  {
    ...pendingQuantitativeMapping,
    code: '9.6.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de points de recharge accessibles aux utilitaires en zone d'activités
  {
    ...pendingQuantitativeMapping,
    code: '9.6.3-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Consommation électrifiée par les projets accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '10-a',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Consommation de gaz du secteur industriel
  {
    ...pendingQuantitativeMapping,
    code: '10-b',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre d'industriels accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '10.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des industriels du registre qui sont accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '10.2.1-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Consommation électrifiée par les projets engagés
  {
    ...pendingQuantitativeMapping,
    code: '10.2.2-a',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre d'équipements fonctionnant aux énergies fossiles remplacés par des équipements électriques
  {
    ...pendingQuantitativeMapping,
    code: '10.2.2-b',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de projets de mutualisation accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '10.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de fonciers d'activité dont le raccordement est sécurisé
  {
    ...pendingQuantitativeMapping,
    code: '10.3.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Consommation électrifiée par les projets accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '11-a',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
  // Nombre d'exploitations repérées
  {
    ...pendingQuantitativeMapping,
    code: '11.1.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'agriculteurs accompagnés
  {
    ...pendingQuantitativeMapping,
    code: '11.2.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Part des exploitations repérées qui sont accompagnées
  {
    ...pendingQuantitativeMapping,
    code: '11.2.1-b',
    unite: '%',
    periodicite: 'annuelle',
  },
  // Nombre de projets repérés par les permis de construire et contactés
  {
    ...pendingQuantitativeMapping,
    code: '11.2.2-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre de projets photovoltaïques agricoles intégrant l'électrification d'équipements
  {
    ...pendingQuantitativeMapping,
    code: '11.2.5-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Nombre d'exploitations ayant assisté à une démonstration ou reçu une visite
  {
    ...pendingQuantitativeMapping,
    code: '11.3.1-a',
    unite: 'nb',
    periodicite: 'annuelle',
  },
  // Consommation de fioul du secteur résidentiel
  {
    ...pendingQuantitativeMapping,
    code: '1-f',
    unite: 'MWh',
    periodicite: 'annuelle',
  },
];
