import { Levier } from '@tet/domain/shared';

export const LEVIER_DEFINITIONS: Record<Levier, string> = {
  'Changement chaudières fioul + rénovation (résidentiel)':
    "Remplacement des chaudières au fioul des logements par un système décarboné, accompagné de la rénovation de l'enveloppe.",
  'Changement chaudières gaz + rénovation (résidentiel)':
    "Remplacement des chaudières au gaz des logements par un système décarboné, accompagné de la rénovation de l'enveloppe.",
  'Sobriété des bâtiments (résidentiel)':
    'Baisse des consommations de chauffage des logements par le réglage et les usages, sans travaux lourds.',
  'Changement de chaudière à fioul (tertiaire)':
    "Remplacement des chaudières au fioul des bâtiments d'activité : bureaux, commerces, écoles, équipements publics.",
  'Changement de chaudière à gaz (tertiaire)':
    "Remplacement des chaudières au gaz des bâtiments d'activité.",
  'Sobriété et isolation des bâtiments (tertiaire)':
    "Isolation et baisse des consommations des bâtiments d'activité.",
  'Réduction des déplacements':
    'Diminution des kilomètres parcourus : télétravail, services de proximité, urbanisme réduisant les besoins de mobilité.',
  Covoiturage:
    'Augmentation du taux de remplissage des voitures : aires, plateformes, incitations au partage de trajets.',
  'Vélo et transport en commun':
    'Report modal de la voiture individuelle vers le vélo, la marche et les transports collectifs.',
  'Véhicules électriques':
    'Électrification du parc de véhicules particuliers, bornes de recharge comprises.',
  'Efficacité et carburants décarbonés des véhicules privés':
    'Baisse de la consommation des véhicules et recours aux carburants alternatifs, hors électrification.',
  'Bus et cars décarbonés':
    'Décarbonation des flottes de transport collectif de voyageurs.',
  'Fret décarboné et multimodalité':
    'Report du transport de marchandises de la route vers le rail ou le fluvial.',
  'Efficacité et sobriété logistique':
    'Optimisation des flux de marchandises : massification, logistique urbaine, réduction des trajets à vide.',
  'Bâtiments & Machines agricoles':
    'Baisse des consommations énergétiques des exploitations agricoles, bâtiments et engins.',
  'Elevage durable':
    "Réduction des émissions de méthane liées à l'élevage : alimentation du troupeau, gestion des effluents.",
  'Changements de pratiques de fertilisation azotée':
    "Réduction des émissions de protoxyde d'azote par une moindre fertilisation minérale et des pratiques alternatives.",
  'Gestion des forêts et produits bois':
    'Stockage de carbone en forêt et dans les produits bois, gestion sylvicole et filière bois.',
  'Pratiques stockantes':
    'Pratiques agricoles qui stockent du carbone dans les sols : couverts végétaux, agroforesterie, apports organiques.',
  'Gestion des haies':
    'Implantation, entretien et préservation des haies pour leur rôle de stockage carbone.',
  'Gestion des prairies':
    'Maintien et bonne gestion des prairies permanentes comme réservoir de carbone.',
  'Sobriété foncière':
    "Limitation de l'artificialisation des sols et renaturation des surfaces déjà artificialisées.",
  'Production industrielle':
    "Décarbonation des procédés industriels et de l'énergie qu'ils consomment.",
  'Captage de méthane dans les ISDND':
    'Captage et valorisation du biogaz des installations de stockage de déchets non dangereux.',
  'Prévention des déchets':
    'Réduction à la source des quantités produites : réemploi, réparation, lutte contre le gaspillage.',
  'Valorisation matière des déchets':
    'Traitement des déchets produits : tri, collecte séparée, recyclage, compostage.',
  'Electricité renouvelable':
    "Production locale d'électricité renouvelable : photovoltaïque, éolien, hydroélectricité.",
  Biogaz:
    'Production de gaz renouvelable par méthanisation et son injection ou sa valorisation.',
  'Réseaux de chaleur décarbonés':
    'Création, extension et verdissement des réseaux de chaleur et de froid.',
};

export const LEVIER_DISAMBIGUATIONS = [
  "Résidentiel vs tertiaire : le résidentiel désigne les logements, le tertiaire les bâtiments d'activité — bureaux, commerces, écoles, équipements publics. Une rénovation d'école relève du tertiaire, pas du résidentiel.",
  'Transport de personnes vs fret : les leviers de fret et de logistique ne concernent que le transport de marchandises.',
  'Prévention vs valorisation des déchets : la prévention évite de produire le déchet, la valorisation traite celui qui a été produit.',
  "Électricité renouvelable vs réseaux de chaleur : le premier produit de l'électricité, le second distribue de la chaleur.",
  "Sobriété foncière vs aménagement : la sobriété foncière porte sur la non-artificialisation des sols, pas sur la qualité de l'aménagement réalisé.",
];
