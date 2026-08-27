import { DemarchePcaetTopicKindEnum } from './demarche-pcaet-topic-kind.enum.schema';

/** Ligne de second niveau (ou feuille seule sous un parent). */
export type DemarchePcaetDiagnosticTopicLeafConfig = {
  label: string;
  referentielId: string | null;
  requis: boolean;
};

/** Ligne de premier niveau, éventuellement avec enfants. */
export type DemarchePcaetDiagnosticTopicRowConfig =
  DemarchePcaetDiagnosticTopicLeafConfig & {
    rows: readonly DemarchePcaetDiagnosticTopicLeafConfig[];
  };

/** Topic (onglet) du diagnostic PCAET. */
export type DemarchePcaetDiagnosticTopicConfig = {
  code: string;
  label: string;
  icon: string;
  kind: (typeof DemarchePcaetTopicKindEnum)[keyof typeof DemarchePcaetTopicKindEnum];
  groupLabel: string | null;
  rowLabel: string | null;
  unit: string | null;
  referentielId: string | null;
  horizons: readonly number[];
  rows: readonly DemarchePcaetDiagnosticTopicRowConfig[];
};

const HORIZONS_INDICATEURS = [2030, 2036, 2050] as const;

const SECTEURS_GES = [
  { label: 'Résidentiel', referentielId: 'cae_1.c', requis: true },
  { label: 'Tertiaire', referentielId: 'cae_1.d', requis: true },
  { label: 'Transport routier', referentielId: 'cae_1.e', requis: true },
  { label: 'Autres transports', referentielId: 'cae_1.f', requis: true },
  { label: 'Agriculture', referentielId: 'cae_1.g', requis: true },
  { label: 'Déchets', referentielId: 'cae_1.h', requis: true },
  {
    label: 'Industrie hors branche énergie',
    referentielId: 'cae_1.i',
    requis: true,
  },
  { label: 'Branche énergie', referentielId: 'cae_1.j', requis: true },
] as const satisfies readonly DemarchePcaetDiagnosticTopicLeafConfig[];

const SECTEURS_CONSO = [
  { label: 'Résidentiel', referentielId: 'cae_2.e', requis: true },
  { label: 'Tertiaire', referentielId: 'cae_2.f', requis: true },
  { label: 'Transport routier', referentielId: 'cae_2.g', requis: true },
  { label: 'Autres transports', referentielId: 'cae_2.h', requis: true },
  { label: 'Agriculture', referentielId: 'cae_2.i', requis: true },
  { label: 'Déchets', referentielId: 'cae_2.j', requis: true },
  {
    label: 'Industrie hors branche énergie',
    referentielId: 'cae_2.k',
    requis: true,
  },
  { label: 'Branche énergie', referentielId: 'cae_2.l_pcaet', requis: true },
] as const satisfies readonly DemarchePcaetDiagnosticTopicLeafConfig[];

const POLLUANTS = [
  { label: 'NOx', lettre: 'a', referentielId: 'cae_4.a' },
  { label: 'PM10', lettre: 'b', referentielId: 'cae_4.b' },
  { label: 'PM2.5', lettre: 'c', referentielId: 'cae_4.c' },
  { label: 'COVNM', lettre: 'd', referentielId: 'cae_4.d' },
  { label: 'SO2', lettre: 'e', referentielId: 'cae_4.e' },
  { label: 'NH3', lettre: 'f', referentielId: 'cae_4.f' },
] as const;

const SECTEURS_POLLUANTS = [
  { label: 'Résidentiel', lettre: 'a' },
  { label: 'Tertiaire', lettre: 'b' },
  { label: 'Transport routier', lettre: 'g' },
  { label: 'Autres transports', lettre: 'h' },
  { label: 'Agriculture', lettre: 'c' },
  { label: 'Déchets', lettre: 'd' },
  { label: 'Industrie hors branche énergie', lettre: 'e' },
  { label: 'Branche énergie', lettre: 'f' },
  { label: 'Chantiers', lettre: 'i' },
] as const;

const POLLUANTS_ROWS: DemarchePcaetDiagnosticTopicRowConfig[] = POLLUANTS.map(
  (polluant) => ({
    label: polluant.label,
    referentielId: polluant.referentielId,
    requis: true,
    rows: SECTEURS_POLLUANTS.map((secteur) => ({
      label: secteur.label,
      referentielId: `cae_4.${polluant.lettre}${secteur.lettre}`,
      requis: true,
    })),
  })
);

const ENR_ROWS: DemarchePcaetDiagnosticTopicRowConfig[] = [
  {
    label: 'Électrique',
    referentielId: null,
    requis: false,
    rows: [
      { label: 'Éolien terrestre', referentielId: 'cae_3.ad', requis: false },
      {
        label: 'Solaire photovoltaïque',
        referentielId: 'cae_3.ac',
        requis: false,
      },
      { label: 'Hydrolien', referentielId: 'cae_3.aq', requis: false },
      { label: 'Biomasse solide', referentielId: 'cae_3.ab', requis: false },
      { label: 'Méthanisation', referentielId: 'cae_3.aa', requis: false },
      { label: 'Déchets', referentielId: 'cae_3.ae', requis: false },
    ],
  },
  {
    label: 'Thermique',
    referentielId: null,
    requis: false,
    rows: [
      { label: 'Biomasse solide', referentielId: 'cae_3.ag', requis: false },
      { label: 'Chaufferies bois', referentielId: 'cae_3.ah', requis: false },
      { label: 'Bois domestique', referentielId: 'cae_3.ai', requis: false },
      { label: 'Solaire thermique', referentielId: 'cae_3.aj', requis: false },
      {
        label: 'Géothermie profonde',
        referentielId: 'cae_3.ak',
        requis: false,
      },
      {
        label: 'Géothermie de surface (PAC)',
        referentielId: 'cae_3.am',
        requis: false,
      },
      { label: 'Aérothermie (PAC)', referentielId: 'cae_3.an', requis: false },
      { label: 'Méthanisation', referentielId: 'cae_3.af', requis: false },
      { label: 'Déchets', referentielId: 'cae_3.ao', requis: false },
      { label: 'Autre', referentielId: 'cae_3.ap', requis: false },
    ],
  },
  {
    label: 'Gaz',
    referentielId: null,
    requis: false,
    rows: [
      { label: 'Méthanisation', referentielId: 'cae_3.c', requis: false },
    ],
  },
];

/**
 * Référentiel d'affichage du diagnostic PCAET : onglets, lignes et horizons.
 * Remplace les tables `demarche_pcaet_topic` / `demarche_pcaet_topic_row`.
 * Ordre = ordre réglementaire (émissions GES → polluants → séquestration →
 * consommation → ENR → vulnérabilité).
 */
export const DEMARCHE_PCAET_DIAGNOSTIC_TOPICS = [
  {
    code: 'profil_energie_climat',
    label: 'Émissions GES',
    icon: 'fire-line',
    kind: DemarchePcaetTopicKindEnum.INDICATEURS,
    groupLabel: 'Secteur',
    rowLabel: null,
    unit: 'kteq CO2',
    referentielId: 'cae_1.a',
    horizons: HORIZONS_INDICATEURS,
    rows: SECTEURS_GES.map((row) => ({ ...row, rows: [] })),
  },
  {
    code: 'polluants_atmospheriques',
    label: 'Polluants atmosphériques',
    icon: 'haze-2-line',
    kind: DemarchePcaetTopicKindEnum.INDICATEURS,
    groupLabel: 'Polluant',
    rowLabel: 'Secteur',
    unit: 'tonnes',
    referentielId: 'emission_polluants_atmo',
    horizons: HORIZONS_INDICATEURS,
    rows: POLLUANTS_ROWS,
  },
  {
    code: 'sequestration',
    label: 'Séquestration carbone',
    icon: 'seedling-line',
    kind: DemarchePcaetTopicKindEnum.INDICATEURS,
    groupLabel: 'Poste',
    rowLabel: null,
    unit: 'kteq CO2',
    referentielId: 'cae_63.a',
    horizons: HORIZONS_INDICATEURS,
    rows: [
      { label: 'Forêt', referentielId: 'cae_63.b', requis: true, rows: [] },
      {
        label: 'Terres agricoles et prairies',
        referentielId: 'cae_63.c',
        requis: true,
        rows: [],
      },
      {
        label: 'Autres sols',
        referentielId: 'cae_63.d',
        requis: false,
        rows: [],
      },
      {
        label: 'Produits bois',
        referentielId: 'cae_63.e',
        requis: false,
        rows: [],
      },
    ],
  },
  {
    code: 'consommation_energetique',
    label: 'Consommation énergétique finale',
    icon: 'flashlight-line',
    kind: DemarchePcaetTopicKindEnum.INDICATEURS,
    groupLabel: 'Secteur',
    rowLabel: null,
    unit: 'GWh',
    referentielId: 'cae_2.a',
    horizons: HORIZONS_INDICATEURS,
    rows: SECTEURS_CONSO.map((row) => ({ ...row, rows: [] })),
  },
  {
    code: 'enr',
    label: 'Énergies renouvelables',
    icon: 'sun-line',
    kind: DemarchePcaetTopicKindEnum.INDICATEURS,
    groupLabel: 'Vecteur',
    rowLabel: 'Filière',
    unit: 'MWh',
    referentielId: 'cae_3.a',
    horizons: HORIZONS_INDICATEURS,
    rows: ENR_ROWS,
  },
  {
    code: 'vulnerabilite_territoire',
    label: 'Vulnérabilité du territoire',
    icon: 'map-2-line',
    kind: DemarchePcaetTopicKindEnum.VULNERABILITE,
    groupLabel: null,
    rowLabel: null,
    unit: null,
    referentielId: null,
    horizons: [2050, 2100],
    rows: [],
  },
] as const satisfies readonly DemarchePcaetDiagnosticTopicConfig[];

/** Identifiants référentiel de toutes les lignes saisissables. */
export const listDemarchePcaetDiagnosticReferentielIds = (): string[] => {
  const ids: string[] = [];
  for (const topic of DEMARCHE_PCAET_DIAGNOSTIC_TOPICS) {
    if (topic.referentielId !== null) {
      ids.push(topic.referentielId);
    }
    for (const row of topic.rows) {
      if (row.referentielId !== null) {
        ids.push(row.referentielId);
      }
      for (const child of row.rows) {
        if (child.referentielId !== null) {
          ids.push(child.referentielId);
        }
      }
    }
  }
  return [...new Set(ids)];
};

export const findDemarchePcaetDiagnosticTopicByCode = (
  code: string
): DemarchePcaetDiagnosticTopicConfig | undefined =>
  DEMARCHE_PCAET_DIAGNOSTIC_TOPICS.find((topic) => topic.code === code);
