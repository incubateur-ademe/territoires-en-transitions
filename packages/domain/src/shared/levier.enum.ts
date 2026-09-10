import { invert } from 'es-toolkit';
import { TrajectoireSecteursType } from '../indicateurs/trajectoires/trajectoire-secteurs';

export const levierEnumValues = [
  'Changement chaudières fioul + rénovation (résidentiel)',
  'Changement chaudières gaz + rénovation (résidentiel)',
  'Sobriété des bâtiments (résidentiel)',
  'Changement de chaudière à fioul (tertiaire)',
  'Changement de chaudière à gaz (tertiaire)',
  'Sobriété et isolation des bâtiments (tertiaire)',
  'Réduction des déplacements',
  'Covoiturage',
  'Vélo et transport en commun',
  'Véhicules électriques',
  'Efficacité et carburants décarbonés des véhicules privés',
  'Bus et cars décarbonés',
  'Fret décarboné et multimodalité',
  'Efficacité et sobriété logistique',
  'Bâtiments & Machines agricoles',
  'Elevage durable',
  'Changements de pratiques de fertilisation azotée',
  'Gestion des forêts et produits bois',
  'Pratiques stockantes',
  'Gestion des haies',
  'Gestion des prairies',
  'Sobriété foncière',
  'Production industrielle',
  'Captage de méthane dans les ISDND',
  'Prévention des déchets',
  'Valorisation matière des déchets',
  'Electricité renouvelable',
  'Biogaz',
  'Réseaux de chaleur décarbonés',
] as const;

export type Levier = (typeof levierEnumValues)[number];

export const levierIdEnumValues = [
  'chaudieres_fioul_renovation_residentiel',
  'chaudieres_gaz_renovation_residentiel',
  'sobriete_batiments_residentiel',
  'chaudiere_fioul_tertiaire',
  'chaudiere_gaz_tertiaire',
  'sobriete_isolation_batiments_tertiaire',
  'reduction_deplacements',
  'covoiturage',
  'velo_transport_commun',
  'vehicules_electriques',
  'efficacite_carburants_decarbones_vehicules_prives',
  'bus_cars_decarbones',
  'fret_decarbone_multimodalite',
  'efficacite_sobriete_logistique',
  'batiments_machines_agricoles',
  'elevage_durable',
  'pratiques_fertilisation_azotee',
  'gestion_forets_produits_bois',
  'pratiques_stockantes',
  'gestion_haies',
  'gestion_prairies',
  'sobriete_fonciere',
  'production_industrielle',
  'captage_methane_isdnd',
  'prevention_dechets',
  'valorisation_matiere_dechets',
  'electricite_renouvelable',
  'biogaz',
  'reseaux_chaleur_decarbones',
] as const;

export type LevierId = (typeof levierIdEnumValues)[number];

export const LEVIER_NOM_BY_ID = {
  chaudieres_fioul_renovation_residentiel:
    'Changement chaudières fioul + rénovation (résidentiel)',
  chaudieres_gaz_renovation_residentiel:
    'Changement chaudières gaz + rénovation (résidentiel)',
  sobriete_batiments_residentiel: 'Sobriété des bâtiments (résidentiel)',
  chaudiere_fioul_tertiaire: 'Changement de chaudière à fioul (tertiaire)',
  chaudiere_gaz_tertiaire: 'Changement de chaudière à gaz (tertiaire)',
  sobriete_isolation_batiments_tertiaire:
    'Sobriété et isolation des bâtiments (tertiaire)',
  reduction_deplacements: 'Réduction des déplacements',
  covoiturage: 'Covoiturage',
  velo_transport_commun: 'Vélo et transport en commun',
  vehicules_electriques: 'Véhicules électriques',
  efficacite_carburants_decarbones_vehicules_prives:
    'Efficacité et carburants décarbonés des véhicules privés',
  bus_cars_decarbones: 'Bus et cars décarbonés',
  fret_decarbone_multimodalite: 'Fret décarboné et multimodalité',
  efficacite_sobriete_logistique: 'Efficacité et sobriété logistique',
  batiments_machines_agricoles: 'Bâtiments & Machines agricoles',
  elevage_durable: 'Elevage durable',
  pratiques_fertilisation_azotee:
    'Changements de pratiques de fertilisation azotée',
  gestion_forets_produits_bois: 'Gestion des forêts et produits bois',
  pratiques_stockantes: 'Pratiques stockantes',
  gestion_haies: 'Gestion des haies',
  gestion_prairies: 'Gestion des prairies',
  sobriete_fonciere: 'Sobriété foncière',
  production_industrielle: 'Production industrielle',
  captage_methane_isdnd: 'Captage de méthane dans les ISDND',
  prevention_dechets: 'Prévention des déchets',
  valorisation_matiere_dechets: 'Valorisation matière des déchets',
  electricite_renouvelable: 'Electricité renouvelable',
  biogaz: 'Biogaz',
  reseaux_chaleur_decarbones: 'Réseaux de chaleur décarbonés',
} satisfies Record<LevierId, Levier>;

export const LEVIER_ID_BY_NOM: Record<Levier, LevierId> =
  invert(LEVIER_NOM_BY_ID);

type LevierSecteur = Exclude<TrajectoireSecteursType, 'CSC'>;

export const LEVIER_SECTEURS = {
  'Changement chaudières fioul + rénovation (résidentiel)': 'Résidentiel',
  'Changement chaudières gaz + rénovation (résidentiel)': 'Résidentiel',
  'Sobriété des bâtiments (résidentiel)': 'Résidentiel',
  'Changement de chaudière à fioul (tertiaire)': 'Tertiaire',
  'Changement de chaudière à gaz (tertiaire)': 'Tertiaire',
  'Sobriété et isolation des bâtiments (tertiaire)': 'Tertiaire',
  'Réduction des déplacements': 'Transports',
  Covoiturage: 'Transports',
  'Vélo et transport en commun': 'Transports',
  'Véhicules électriques': 'Transports',
  'Efficacité et carburants décarbonés des véhicules privés': 'Transports',
  'Bus et cars décarbonés': 'Transports',
  'Fret décarboné et multimodalité': 'Transports',
  'Efficacité et sobriété logistique': 'Transports',
  'Bâtiments & Machines agricoles': 'Agriculture',
  'Elevage durable': 'Agriculture',
  'Changements de pratiques de fertilisation azotée': 'Agriculture',
  'Gestion des forêts et produits bois': 'UTCATF',
  'Pratiques stockantes': 'UTCATF',
  'Gestion des haies': 'UTCATF',
  'Gestion des prairies': 'UTCATF',
  'Sobriété foncière': 'UTCATF',
  'Production industrielle': 'Industrie',
  'Captage de méthane dans les ISDND': 'Déchets',
  'Prévention des déchets': 'Déchets',
  'Valorisation matière des déchets': 'Déchets',
  'Electricité renouvelable': 'Branche énergie',
  Biogaz: 'Branche énergie',
  'Réseaux de chaleur décarbonés': 'Branche énergie',
} satisfies Record<Levier, LevierSecteur>;
