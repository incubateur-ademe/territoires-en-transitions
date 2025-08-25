const REGIONS_FRANCAISES = {
  AUVERGNE_RHONE_ALPES: { code: '84' },
  BOURGOGNE_FRANCHE_COMTE: { code: '27' },
  BRETAGNE: { code: '53' },
  CENTRE_VAL_DE_LOIRE: { code: '24' },
  CORSE: { code: '94' },
  GRAND_EST: { code: '44' },
  HAUTS_DE_FRANCE: { code: '32' },
  ILE_DE_FRANCE: { code: '11' },
  NORMANDIE: { code: '28' },
  NOUVELLE_AQUITAINE: { code: '75' },
  OCCITANIE: { code: '76' },
  PAYS_DE_LA_LOIRE: { code: '52' },
  PROVENCE_ALPES_COTE_AZUR: { code: '93' },
} as const;

export type RegionCode =
  (typeof REGIONS_FRANCAISES)[keyof typeof REGIONS_FRANCAISES]['code'];
type PourcentagesRegionaux = Record<RegionCode, number>;

interface LevierConfiguration {
  nom: string;
  pourcentagesRegionaux: PourcentagesRegionaux;
  sousSecteursIdentifiants?: string[];
}

interface SecteurConfiguration {
  nom: string;
  identifiants: string[];
  couleur?: string;
  leviers: LevierConfiguration[];
}

interface TrajectoireLeviersRegionConfiguration {
  secteurs: SecteurConfiguration[];
}

// Fonctions utilitaires pour créer les configurations de pourcentages
const createPourcentagesRegionaux = (
  config: Record<keyof typeof REGIONS_FRANCAISES, number>
): PourcentagesRegionaux => {
  const result: Partial<PourcentagesRegionaux> = {};

  Object.entries(config).forEach(([regionKey, percentage]) => {
    const regionCode =
      REGIONS_FRANCAISES[regionKey as keyof typeof REGIONS_FRANCAISES]?.code;
    if (regionCode) {
      result[regionCode as RegionCode] = percentage;
    }
  });

  return result as PourcentagesRegionaux;
};

const createUniformPercentage = (percentage: number): PourcentagesRegionaux => {
  const result: Partial<PourcentagesRegionaux> = {};

  Object.values(REGIONS_FRANCAISES).forEach((region) => {
    result[region.code as RegionCode] = percentage;
  });

  return result as PourcentagesRegionaux;
};

// Configuration des leviers par secteur
const LEVIERS_RESIDENTIEL: LevierConfiguration[] = [
  {
    nom: 'Changement chaudières fioul + rénovation (résidentiel)',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 43,
      BOURGOGNE_FRANCHE_COMTE: 48,
      BRETAGNE: 51,
      CENTRE_VAL_DE_LOIRE: 40,
      CORSE: 10,
      GRAND_EST: 43,
      HAUTS_DE_FRANCE: 31,
      ILE_DE_FRANCE: 24,
      NORMANDIE: 45,
      NOUVELLE_AQUITAINE: 41,
      OCCITANIE: 41,
      PAYS_DE_LA_LOIRE: 41,
      PROVENCE_ALPES_COTE_AZUR: 42,
    }),
  },
  {
    nom: 'Changement chaudières gaz + rénovation (résidentiel)',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 32,
      BOURGOGNE_FRANCHE_COMTE: 28,
      BRETAGNE: 26,
      CENTRE_VAL_DE_LOIRE: 32,
      CORSE: 17,
      GRAND_EST: 33,
      HAUTS_DE_FRANCE: 43,
      ILE_DE_FRANCE: 47,
      NORMANDIE: 29,
      NOUVELLE_AQUITAINE: 32,
      OCCITANIE: 32,
      PAYS_DE_LA_LOIRE: 34,
      PROVENCE_ALPES_COTE_AZUR: 32,
    }),
  },
  {
    nom: 'Sobriété des bâtiments (résidentiel)',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 25,
      BOURGOGNE_FRANCHE_COMTE: 23,
      BRETAGNE: 23,
      CENTRE_VAL_DE_LOIRE: 28,
      CORSE: 73,
      GRAND_EST: 24,
      HAUTS_DE_FRANCE: 26,
      ILE_DE_FRANCE: 28,
      NORMANDIE: 26,
      NOUVELLE_AQUITAINE: 27,
      OCCITANIE: 26,
      PAYS_DE_LA_LOIRE: 25,
      PROVENCE_ALPES_COTE_AZUR: 26,
    }),
  },
];

const LEVIERS_TERTIAIRE: LevierConfiguration[] = [
  {
    nom: 'Changement de chaudière à fioul (tertiaire)',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 37,
      BOURGOGNE_FRANCHE_COMTE: 39,
      BRETAGNE: 32,
      CENTRE_VAL_DE_LOIRE: 43,
      CORSE: 50,
      GRAND_EST: 36,
      HAUTS_DE_FRANCE: 33,
      ILE_DE_FRANCE: 15,
      NORMANDIE: 40,
      NOUVELLE_AQUITAINE: 41,
      OCCITANIE: 38,
      PAYS_DE_LA_LOIRE: 39,
      PROVENCE_ALPES_COTE_AZUR: 31,
    }),
  },
  {
    nom: 'Changement de chaudière à gaz (tertiaire)',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 17,
      BOURGOGNE_FRANCHE_COMTE: 19,
      BRETAGNE: 23,
      CENTRE_VAL_DE_LOIRE: 16,
      CORSE: 0,
      GRAND_EST: 21,
      HAUTS_DE_FRANCE: 21,
      ILE_DE_FRANCE: 24,
      NORMANDIE: 17,
      NOUVELLE_AQUITAINE: 15,
      OCCITANIE: 14,
      PAYS_DE_LA_LOIRE: 19,
      PROVENCE_ALPES_COTE_AZUR: 16,
    }),
  },
  {
    nom: 'Sobriété et isolation des bâtiments (tertiaire)',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 45,
      BOURGOGNE_FRANCHE_COMTE: 42,
      BRETAGNE: 46,
      CENTRE_VAL_DE_LOIRE: 42,
      CORSE: 50,
      GRAND_EST: 43,
      HAUTS_DE_FRANCE: 47,
      ILE_DE_FRANCE: 60,
      NORMANDIE: 43,
      NOUVELLE_AQUITAINE: 43,
      OCCITANIE: 48,
      PAYS_DE_LA_LOIRE: 42,
      PROVENCE_ALPES_COTE_AZUR: 53,
    }),
  },
];

const LEVIERS_TRANSPORTS: LevierConfiguration[] = [
  {
    nom: 'Réduction des déplacements',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 5,
      BOURGOGNE_FRANCHE_COMTE: 4,
      BRETAGNE: 5,
      CENTRE_VAL_DE_LOIRE: 4,
      CORSE: 8,
      GRAND_EST: 4,
      HAUTS_DE_FRANCE: 4,
      ILE_DE_FRANCE: 8,
      NORMANDIE: 4,
      NOUVELLE_AQUITAINE: 5,
      OCCITANIE: 5,
      PAYS_DE_LA_LOIRE: 5,
      PROVENCE_ALPES_COTE_AZUR: 6,
    }),
  },
  {
    nom: 'Covoiturage',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 5,
      BOURGOGNE_FRANCHE_COMTE: 4,
      BRETAGNE: 5,
      CENTRE_VAL_DE_LOIRE: 4,
      CORSE: 8,
      GRAND_EST: 4,
      HAUTS_DE_FRANCE: 4,
      ILE_DE_FRANCE: 8,
      NORMANDIE: 4,
      NOUVELLE_AQUITAINE: 5,
      OCCITANIE: 5,
      PAYS_DE_LA_LOIRE: 5,
      PROVENCE_ALPES_COTE_AZUR: 6,
    }),
  },
  {
    nom: 'Vélo et transport en commun',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 8,
      BOURGOGNE_FRANCHE_COMTE: 7,
      BRETAGNE: 8,
      CENTRE_VAL_DE_LOIRE: 7,
      CORSE: 14,
      GRAND_EST: 7,
      HAUTS_DE_FRANCE: 7,
      ILE_DE_FRANCE: 13,
      NORMANDIE: 7,
      NOUVELLE_AQUITAINE: 8,
      OCCITANIE: 9,
      PAYS_DE_LA_LOIRE: 8,
      PROVENCE_ALPES_COTE_AZUR: 9,
    }),
  },
  {
    nom: 'Véhicules électriques',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 19,
      BOURGOGNE_FRANCHE_COMTE: 18,
      BRETAGNE: 20,
      CENTRE_VAL_DE_LOIRE: 18,
      CORSE: 32,
      GRAND_EST: 18,
      HAUTS_DE_FRANCE: 16,
      ILE_DE_FRANCE: 20,
      NORMANDIE: 18,
      NOUVELLE_AQUITAINE: 19,
      OCCITANIE: 22,
      PAYS_DE_LA_LOIRE: 19,
      PROVENCE_ALPES_COTE_AZUR: 21,
    }),
  },
  {
    nom: 'Efficacité et carburants décarbonés des véhicules privés',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 10,
      BOURGOGNE_FRANCHE_COMTE: 10,
      BRETAGNE: 11,
      CENTRE_VAL_DE_LOIRE: 10,
      CORSE: 17,
      GRAND_EST: 10,
      HAUTS_DE_FRANCE: 9,
      ILE_DE_FRANCE: 11,
      NORMANDIE: 10,
      NOUVELLE_AQUITAINE: 11,
      OCCITANIE: 12,
      PAYS_DE_LA_LOIRE: 10,
      PROVENCE_ALPES_COTE_AZUR: 12,
    }),
  },
  {
    nom: 'Bus et cars décarbonés',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 1,
      BOURGOGNE_FRANCHE_COMTE: 1,
      BRETAGNE: 1,
      CENTRE_VAL_DE_LOIRE: 1,
      CORSE: 3,
      GRAND_EST: 1,
      HAUTS_DE_FRANCE: 1,
      ILE_DE_FRANCE: 2,
      NORMANDIE: 1,
      NOUVELLE_AQUITAINE: 1,
      OCCITANIE: 1,
      PAYS_DE_LA_LOIRE: 1,
      PROVENCE_ALPES_COTE_AZUR: 2,
    }),
  },
  {
    nom: 'Fret décarboné et multimodalité',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 23,
      BOURGOGNE_FRANCHE_COMTE: 25,
      BRETAGNE: 22,
      CENTRE_VAL_DE_LOIRE: 25,
      CORSE: 8,
      GRAND_EST: 25,
      HAUTS_DE_FRANCE: 26,
      ILE_DE_FRANCE: 17,
      NORMANDIE: 25,
      NOUVELLE_AQUITAINE: 23,
      OCCITANIE: 20,
      PAYS_DE_LA_LOIRE: 24,
      PROVENCE_ALPES_COTE_AZUR: 20,
    }),
  },
  {
    nom: 'Efficacité et sobriété logistique',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 28,
      BOURGOGNE_FRANCHE_COMTE: 31,
      BRETAGNE: 28,
      CENTRE_VAL_DE_LOIRE: 31,
      CORSE: 9,
      GRAND_EST: 31,
      HAUTS_DE_FRANCE: 32,
      ILE_DE_FRANCE: 21,
      NORMANDIE: 30,
      NOUVELLE_AQUITAINE: 29,
      OCCITANIE: 25,
      PAYS_DE_LA_LOIRE: 29,
      PROVENCE_ALPES_COTE_AZUR: 25,
    }),
  },
];

const LEVIERS_AGRICULTURE_FORETS_SOLS: LevierConfiguration[] = [
  {
    nom: 'Bâtiments & Machines agricoles',
    sousSecteursIdentifiants: ['cae_1.ga'],
    pourcentagesRegionaux: createUniformPercentage(100),
  },
  {
    nom: 'Elevage durable',
    sousSecteursIdentifiants: ['cae_1.gb'],
    pourcentagesRegionaux: createUniformPercentage(100),
  },
  {
    nom: 'Changements de pratiques de fertilisation azotée',
    sousSecteursIdentifiants: ['cae_1.gc'],
    pourcentagesRegionaux: createUniformPercentage(100),
  },
  {
    nom: 'Gestion des forêts et produits bois',
    sousSecteursIdentifiants: ['cae_63.b', 'cae_63.e'],
    pourcentagesRegionaux: createUniformPercentage(100),
  },
  {
    nom: 'Pratiques stockantes',
    sousSecteursIdentifiants: ['cae_63.ca'],
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 34,
      BOURGOGNE_FRANCHE_COMTE: 41,
      BRETAGNE: 55,
      CENTRE_VAL_DE_LOIRE: 53,
      CORSE: 5,
      GRAND_EST: 50,
      HAUTS_DE_FRANCE: 54,
      ILE_DE_FRANCE: 57,
      NORMANDIE: 46,
      NOUVELLE_AQUITAINE: 47,
      OCCITANIE: 40,
      PAYS_DE_LA_LOIRE: 51,
      PROVENCE_ALPES_COTE_AZUR: 26,
    }),
  },
  {
    nom: 'Gestion des haies',
    sousSecteursIdentifiants: ['cae_63.ca'],
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 66,
      BOURGOGNE_FRANCHE_COMTE: 59,
      BRETAGNE: 45,
      CENTRE_VAL_DE_LOIRE: 47,
      CORSE: 95,
      GRAND_EST: 50,
      HAUTS_DE_FRANCE: 46,
      ILE_DE_FRANCE: 43,
      NORMANDIE: 54,
      NOUVELLE_AQUITAINE: 53,
      OCCITANIE: 60,
      PAYS_DE_LA_LOIRE: 49,
      PROVENCE_ALPES_COTE_AZUR: 74,
    }),
  },
  {
    nom: 'Gestion des prairies',
    sousSecteursIdentifiants: ['cae_63.cb'],
    pourcentagesRegionaux: createUniformPercentage(100),
  },
  {
    nom: 'Sobriété foncière',
    sousSecteursIdentifiants: ['cae_63.db'],
    pourcentagesRegionaux: createUniformPercentage(100),
  },
];

const LEVIERS_INDUSTRIE: LevierConfiguration[] = [
  {
    nom: 'Production industrielle',
    pourcentagesRegionaux: createUniformPercentage(100),
  },
];

const LEVIERS_DECHETS: LevierConfiguration[] = [
  {
    nom: 'Captage de méthane dans les ISDND',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 59,
      BOURGOGNE_FRANCHE_COMTE: 66,
      BRETAGNE: 43,
      CENTRE_VAL_DE_LOIRE: 64,
      CORSE: 64,
      GRAND_EST: 60,
      HAUTS_DE_FRANCE: 66,
      ILE_DE_FRANCE: 63,
      NORMANDIE: 62,
      NOUVELLE_AQUITAINE: 62,
      OCCITANIE: 61,
      PAYS_DE_LA_LOIRE: 64,
      PROVENCE_ALPES_COTE_AZUR: 53,
    }),
  },
  {
    nom: 'Prévention des déchets',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 7,
      BOURGOGNE_FRANCHE_COMTE: 6,
      BRETAGNE: 11,
      CENTRE_VAL_DE_LOIRE: 6,
      CORSE: 5,
      GRAND_EST: 6,
      HAUTS_DE_FRANCE: 6,
      ILE_DE_FRANCE: 5,
      NORMANDIE: 6,
      NOUVELLE_AQUITAINE: 7,
      OCCITANIE: 7,
      PAYS_DE_LA_LOIRE: 7,
      PROVENCE_ALPES_COTE_AZUR: 7,
    }),
  },
  {
    nom: 'Valorisation matière des déchets',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 35,
      BOURGOGNE_FRANCHE_COMTE: 28,
      BRETAGNE: 46,
      CENTRE_VAL_DE_LOIRE: 30,
      CORSE: 31,
      GRAND_EST: 34,
      HAUTS_DE_FRANCE: 28,
      ILE_DE_FRANCE: 32,
      NORMANDIE: 32,
      NOUVELLE_AQUITAINE: 30,
      OCCITANIE: 33,
      PAYS_DE_LA_LOIRE: 30,
      PROVENCE_ALPES_COTE_AZUR: 40,
    }),
  },
];

const LEVIERS_ENERGIE: LevierConfiguration[] = [
  {
    nom: 'Electricité renouvelable',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 50,
      BOURGOGNE_FRANCHE_COMTE: 101,
      BRETAGNE: 88,
      CENTRE_VAL_DE_LOIRE: 96,
      CORSE: 52,
      GRAND_EST: 44,
      HAUTS_DE_FRANCE: 25,
      ILE_DE_FRANCE: 15,
      NORMANDIE: 20,
      NOUVELLE_AQUITAINE: 95,
      OCCITANIE: 67,
      PAYS_DE_LA_LOIRE: 39,
      PROVENCE_ALPES_COTE_AZUR: 96,
    }),
  },
  {
    nom: 'Biogaz',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 44,
      BOURGOGNE_FRANCHE_COMTE: 78,
      BRETAGNE: 163,
      CENTRE_VAL_DE_LOIRE: 110,
      CORSE: 40,
      GRAND_EST: 79,
      HAUTS_DE_FRANCE: 61,
      ILE_DE_FRANCE: 15,
      NORMANDIE: 77,
      NOUVELLE_AQUITAINE: 94,
      OCCITANIE: 59,
      PAYS_DE_LA_LOIRE: 85,
      PROVENCE_ALPES_COTE_AZUR: 19,
    }),
  },
  {
    nom: 'Réseaux de chaleur décarbonés',
    pourcentagesRegionaux: createPourcentagesRegionaux({
      AUVERGNE_RHONE_ALPES: 38,
      BOURGOGNE_FRANCHE_COMTE: 35,
      BRETAGNE: 17,
      CENTRE_VAL_DE_LOIRE: 20,
      CORSE: 0,
      GRAND_EST: 53,
      HAUTS_DE_FRANCE: 31,
      ILE_DE_FRANCE: 113,
      NORMANDIE: 26,
      NOUVELLE_AQUITAINE: 10,
      OCCITANIE: 7,
      PAYS_DE_LA_LOIRE: 16,
      PROVENCE_ALPES_COTE_AZUR: 8,
    }),
  },
];

export const TRAJECTOIRE_LEVIERS_CONFIGURATION: TrajectoireLeviersRegionConfiguration =
  {
    secteurs: [
      {
        nom: 'Résidentiel',
        identifiants: ['cae_1.c'],
        leviers: LEVIERS_RESIDENTIEL,
      },
      {
        nom: 'Tertiaire',
        identifiants: ['cae_1.d'],
        leviers: LEVIERS_TERTIAIRE,
      },
      {
        nom: 'Transports',
        identifiants: ['cae_1.k'],
        leviers: LEVIERS_TRANSPORTS,
      },
      {
        nom: 'Agriculture, Forêts et Sols',
        identifiants: ['cae_1.g'],
        leviers: LEVIERS_AGRICULTURE_FORETS_SOLS,
      },
      {
        nom: 'Industrie',
        identifiants: ['cae_1.i', 'cae_1.csc'],
        leviers: LEVIERS_INDUSTRIE,
      },
      {
        nom: 'Déchets',
        identifiants: ['cae_1.h'],
        leviers: LEVIERS_DECHETS,
      },
      {
        nom: 'Energie',
        identifiants: ['cae_1.j'],
        leviers: LEVIERS_ENERGIE,
      },
    ],
  };
