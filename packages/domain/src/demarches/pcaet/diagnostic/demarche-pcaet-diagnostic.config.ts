import { PcaetDiagnosticIndicateurParentConfig } from './demarche-pcaet-diagnostic.schema';

/** Ligne de second niveau (ou feuille seule sous un parent). */
export type DemarchePcaetDiagnosticTopicLeafConfig = {
  label: string;
  indicateurDefinitionId: string | null;
  requis: boolean;
};

/** Ligne de premier niveau, éventuellement avec enfants. */
export type PcaetDiagnosticIndicateurTableConfig =
  DemarchePcaetDiagnosticTopicLeafConfig & {
    rows: readonly DemarchePcaetDiagnosticTopicLeafConfig[];
  };

/**
 * Topic vulnérabilité du diagnostic PCAET : table de niveaux par thématique,
 * hors référentiel indicateurs.
 */
export type PcaetDiagnosticVulnerabiliteConfig = {
  code: string;
  label: string;
  icon: string;
  horizons: readonly number[];
};

export const PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS: readonly number[] =
  [2030, 2036, 2050];

const EMISSIONS_GES = {
  code: 'emissions_ges',
  label: 'Émissions GES',
  icon: 'fire-line',
  indicateurDefinitionId: 'cae_1.a',
  referenceYearApplyLevel: 'parent',
  children: [
    {
      label: 'Résidentiel',
      indicateurDefinitionId: 'cae_1.c',
      optionalYears: [2050],
    },
    {
      label: 'Tertiaire',
      indicateurDefinitionId: 'cae_1.d',
      optionalYears: [2050],
    },
    {
      label: 'Transport routier',
      indicateurDefinitionId: 'cae_1.e',
      optionalYears: [2050],
    },
    {
      label: 'Autres transports',
      indicateurDefinitionId: 'cae_1.f',
      optionalYears: [2050],
    },
    {
      label: 'Agriculture',
      indicateurDefinitionId: 'cae_1.g',
      optionalYears: [2050],
    },
    {
      label: 'Déchets',
      indicateurDefinitionId: 'cae_1.h',
      optionalYears: [2050],
    },
    {
      label: 'Industrie hors branche énergie',
      indicateurDefinitionId: 'cae_1.i',
      optionalYears: [2050],
    },
    {
      label: 'Industrie branche énergie',
      indicateurDefinitionId: 'cae_1.j',
      optionalYears: [2050],
    },
  ],
} as const satisfies PcaetDiagnosticIndicateurParentConfig;

const CONSO_ENERGETIQUE = {
  code: 'consommation_energetique',
  label: 'Consommation énergétique finale',
  icon: 'flashlight-line',
  // groupLabel: 'Secteur',
  // rowLabel: null,
  // unit: 'GWh',
  indicateurDefinitionId: 'cae_2.a',
  referenceYearApplyLevel: 'parent',
  children: [
    {
      label: 'Résidentiel',
      indicateurDefinitionId: 'cae_2.e',
      optionalYears: [2050],
    },
    {
      label: 'Tertiaire',
      indicateurDefinitionId: 'cae_2.f',
      optionalYears: [2050],
    },
    {
      label: 'Transport routier',
      indicateurDefinitionId: 'cae_2.g',
      optionalYears: [2050],
    },
    {
      label: 'Autres transports',
      indicateurDefinitionId: 'cae_2.h',
      optionalYears: [2050],
    },
    {
      label: 'Agriculture',
      indicateurDefinitionId: 'cae_2.i',
      optionalYears: [2050],
    },
    {
      label: 'Déchets',
      indicateurDefinitionId: 'cae_2.j',
      optionalYears: [2050],
    },
    {
      label: 'Industrie hors branche énergie',
      indicateurDefinitionId: 'cae_2.k',
      optionalYears: [2050],
    },
    {
      label: 'Industrie branche énergie',
      indicateurDefinitionId: 'cae_2.l_pcaet',
      optionalYears: [2050],
    },
  ],
} as const satisfies PcaetDiagnosticIndicateurParentConfig;

const POLLUANTS_ATMO = {
  code: 'polluants_atmospheriques',
  label: 'Polluants atmosphériques',
  icon: 'haze-2-line',
  indicateurDefinitionId: 'emission_polluants_atmo',
  referenceYearApplyLevel: 'child',
  children: [
    {
      label: 'NOx',
      indicateurDefinitionId: 'cae_4.a',
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_4.aa',
        },
        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_4.ab',
        },
        {
          label: 'Transport routier',
          indicateurDefinitionId: 'cae_4.ag',
        },
        {
          label: 'Autres transports',
          indicateurDefinitionId: 'cae_4.ah',
        },
        {
          label: 'Agriculture',
          indicateurDefinitionId: 'cae_4.ac',
        },
        {
          label: 'Déchets',
          indicateurDefinitionId: 'cae_4.ad',
        },
        {
          label: 'Industrie hors branche énergie',
          indicateurDefinitionId: 'cae_4.ae',
        },
        {
          label: 'Industrie branche énergie',
          indicateurDefinitionId: 'cae_4.af',
        },
      ],
    },
    {
      label: 'PM10',
      indicateurDefinitionId: 'cae_4.b',
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_4.ba',
        },

        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_4.bb',
        },
        {
          label: 'Transport routier',
          indicateurDefinitionId: 'cae_4.bg',
        },

        {
          label: 'Autres transports',
          indicateurDefinitionId: 'cae_4.bh',
        },
        {
          label: 'Agriculture',
          indicateurDefinitionId: 'cae_4.bc',
        },
        {
          label: 'Déchets',
          indicateurDefinitionId: 'cae_4.bd',
        },
        {
          label: 'Industrie hors branche énergie',
          indicateurDefinitionId: 'cae_4.be',
        },
        {
          label: 'Industrie branche énergie',
          indicateurDefinitionId: 'cae_4.bf',
        },
      ],
    },
    {
      label: 'PM2.5',
      indicateurDefinitionId: 'cae_4.c',
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_4.ca',
        },
        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_4.cb',
        },
        {
          label: 'Transport routier',
          indicateurDefinitionId: 'cae_4.cg',
        },
        {
          label: 'Autres transports',
          indicateurDefinitionId: 'cae_4.ch',
        },
        {
          label: 'Agriculture',
          indicateurDefinitionId: 'cae_4.cc',
        },
        {
          label: 'Déchets',
          indicateurDefinitionId: 'cae_4.cd',
        },
        {
          label: 'Industrie hors branche énergie',
          indicateurDefinitionId: 'cae_4.ce',
        },
        {
          label: 'Industrie branche énergie',
          indicateurDefinitionId: 'cae_4.cf',
        },
      ],
    },
    {
      label: 'COVNM',
      indicateurDefinitionId: 'cae_4.d',
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_4.da',
        },
        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_4.db',
        },
        {
          label: 'Transport routier',
          indicateurDefinitionId: 'cae_4.dg',
        },
        {
          label: 'Autres transports',
          indicateurDefinitionId: 'cae_4.dh',
        },
        {
          label: 'Agriculture',
          indicateurDefinitionId: 'cae_4.dc',
        },
        {
          label: 'Déchets',
          indicateurDefinitionId: 'cae_4.dd',
        },
        {
          label: 'Industrie hors branche énergie',
          indicateurDefinitionId: 'cae_4.de',
        },
        {
          label: 'Industrie branche énergie',
          indicateurDefinitionId: 'cae_4.df',
        },
      ],
    },
    {
      label: 'SO2',
      indicateurDefinitionId: 'cae_4.e',
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_4.ea',
        },
        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_4.eb',
        },
        {
          label: 'Transport routier',
          indicateurDefinitionId: 'cae_4.eg',
        },
        {
          label: 'Autres transports',
          indicateurDefinitionId: 'cae_4.eh',
        },
        {
          label: 'Agriculture',
          indicateurDefinitionId: 'cae_4.ec',
        },
        {
          label: 'Déchets',
          indicateurDefinitionId: 'cae_4.ed',
        },
        {
          label: 'Industrie hors branche énergie',
          indicateurDefinitionId: 'cae_4.ee',
        },
        {
          label: 'Industrie branche énergie',
          indicateurDefinitionId: 'cae_4.ef',
        },
      ],
    },
    {
      label: 'NH3',
      indicateurDefinitionId: 'cae_4.f',
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_4.fa',
        },
        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_4.fb',
        },
        {
          label: 'Transport routier',
          indicateurDefinitionId: 'cae_4.fg',
        },
        {
          label: 'Autres transports',
          indicateurDefinitionId: 'cae_4.fh',
        },
        {
          label: 'Agriculture',
          indicateurDefinitionId: 'cae_4.fc',
        },
        {
          label: 'Déchets',
          indicateurDefinitionId: 'cae_4.fd',
        },
        {
          label: 'Industrie hors branche énergie',
          indicateurDefinitionId: 'cae_4.fe',
        },
        {
          label: 'Industrie branche énergie',
          indicateurDefinitionId: 'cae_4.ff',
        },
      ],
    },
  ],
} as const satisfies PcaetDiagnosticIndicateurParentConfig;

const SEQUESTRATION_CARBONE = {
  code: 'sequestration',
  label: 'Séquestration carbone',
  icon: 'seedling-line',
  optional: true,

  indicateurDefinitionId: 'cae_63.a',
  referenceYearApplyLevel: 'child',
  children: [
    {
      label: 'Forêt',
      indicateurDefinitionId: 'cae_63.b',
      optionalYears: 'all',
    },
    {
      label: 'Sols agricoles (terres cultivées et prairies)',
      indicateurDefinitionId: 'cae_63.c',
      optionalYears: 'all',
    },
    {
      label: 'Produits bois',
      indicateurDefinitionId: 'cae_63.e',
      optionalYears: 'all',
    },
    {
      label: 'Autres sols',
      indicateurDefinitionId: 'cae_63.d',
      optionalYears: 'all',
    },
  ],
} as const satisfies PcaetDiagnosticIndicateurParentConfig;

const ENR = {
  code: 'enr',
  label: 'Énergies renouvelables',
  icon: 'sun-line',

  indicateurDefinitionId: 'cae_3.a',
  referenceYearApplyLevel: 'child',
  children: [
    {
      label: 'Éolien terrestre',
      indicateurDefinitionId: 'cae_3.ad',
      groupBy: 'electricité',
    },
    {
      label: 'Solaire photovoltaïque',
      indicateurDefinitionId: 'cae_3.ac',
      groupBy: 'electricité',
    },
    {
      label: 'Solaire thermodynamique',
      indicateurDefinitionId: 'TBD',
      groupBy: 'electricité',
    },
    {
      label: 'Hydraulique',
      indicateurDefinitionId: 'TBD', // crte_3.2 ?
      groupBy: 'electricité',
    },
    {
      label: 'Biomasse solide',
      indicateurDefinitionId: 'cae_3.ab',
      groupBy: 'electricité',
    },
    {
      label: 'Biogaz',
      indicateurDefinitionId: 'cae_3.aa',
      groupBy: 'electricité',
    },
    {
      label: 'Géothermie', // = déchets ?
      indicateurDefinitionId: 'TBD',
      groupBy: 'electricité',
    },

    {
      label: 'Biomasse solide',
      indicateurDefinitionId: 'cae_3.ag',
      groupBy: 'chaleur',
    },
    {
      label: 'Pompes à chaleur',
      indicateurDefinitionId: 'TBD',
      groupBy: 'chaleur',
    },
    {
      label: 'Pompes à chaleur',
      indicateurDefinitionId: 'cae_3.am',
      groupBy: 'chaleur',
    },
    {
      label: 'Géothermie',
      indicateurDefinitionId: 'cae_3.ak',
      groupBy: 'chaleur',
    },
    {
      label: 'Solaire thermique',
      indicateurDefinitionId: 'cae_3.aj',
      groupBy: 'chaleur',
    },
    {
      label: 'Biogaz',
      indicateurDefinitionId: 'cae_3.af',
      groupBy: 'chaleur',
    },
    {
      label: 'Biométhane',
      indicateurDefinitionId: 'TBD',
      groupBy: 'autres',
    },
    {
      label: 'Biocarburants',
      indicateurDefinitionId: 'TBD',
      groupBy: 'autres',
    },
  ],
} as const satisfies PcaetDiagnosticIndicateurParentConfig;

/**
 * Topics indicateurs du diagnostic PCAET.
 * Remplace la table `demarche_pcaet_topic` / `demarche_pcaet_topic_row` pour
 * les volets à grille. Ordre réglementaire : émissions GES → polluants →
 * séquestration → consommation → ENR.
 */
export const PCAET_DIAGNOSTIC_INDICATEURS = [
  EMISSIONS_GES,
  POLLUANTS_ATMO,
  SEQUESTRATION_CARBONE,
  CONSO_ENERGETIQUE,
  ENR,
] as const satisfies readonly PcaetDiagnosticIndicateurParentConfig[];

type IndicateurDefinitionConfigNode = {
  indicateurDefinitionId: string;
  children?: readonly IndicateurDefinitionConfigNode[];
};

const collectIndicateurDefinitionIds = (
  node: IndicateurDefinitionConfigNode
): string[] => [
  node.indicateurDefinitionId,
  ...(node.children?.flatMap(collectIndicateurDefinitionIds) ?? []),
];

/** Identifiants référentiel des lignes saisissables d'un seul volet. */
export const listPcaetDiagnosticIndicateurDefinitionIds = (
  config: PcaetDiagnosticIndicateurParentConfig
): string[] => [...new Set(collectIndicateurDefinitionIds(config))];

/** Identifiants référentiel de toutes les lignes saisissables (indicateurs). */
const collectPcaetDiagnosticIndicateurDefinitionIds = (): string[] => [
  ...new Set(
    PCAET_DIAGNOSTIC_INDICATEURS.flatMap(collectIndicateurDefinitionIds)
  ),
];

export const ALL_PCAET_DIAGNOSTIC_INDICATEUR_IDS =
  collectPcaetDiagnosticIndicateurDefinitionIds();

/**
 * Topic vulnérabilité du diagnostic PCAET (niveaux par thématique, hors
 * référentiel indicateurs).
 */
export const PCAET_DIAGNOSTIC_VULNERABILITE = {
  code: 'vulnerabilite_territoire',
  label: 'Vulnérabilité du territoire',
  icon: 'map-2-line',
  horizons: [2050, 2100],
} as const satisfies PcaetDiagnosticVulnerabiliteConfig;
