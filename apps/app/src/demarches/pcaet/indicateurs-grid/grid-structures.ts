import type { DemarchePcaetVoletId } from '../demarche-pcaet.types';
import type { VoletGridRow, VoletGridStructure } from './build-grid-mock';

const HORIZON_YEARS = [2030, 2036, 2050];

const AIR_SECTOR_ROWS: VoletGridRow[] = [
  { code: 'a', label: 'Résidentiel' },
  { code: 'b', label: 'Tertiaire' },
  { code: 'c', label: 'Agriculture' },
  { code: 'd', label: 'Déchets' },
  { code: 'e', label: 'Industrie hors énergie' },
  { code: 'f', label: 'Branche énergie' },
  { code: 'g', label: 'Transport routier' },
  { code: 'h', label: 'Autres transports' },
  { code: 'i', label: 'Chantiers' },
];

const AIR_POLLUTANTS = ['NOx', 'PM10', 'PM2.5', 'COVNM', 'SO2', 'NH3'];

export const polluantsGridStructure: VoletGridStructure = {
  identifiantPrefix: 'cae_4',
  unit: 'tonnes',
  horizonYears: HORIZON_YEARS,
  groups: AIR_POLLUTANTS.map((label, index) => ({
    code: String.fromCharCode('a'.charCodeAt(0) + index),
    label,
    rows: AIR_SECTOR_ROWS,
  })),
};

const profilGridStructure: VoletGridStructure = {
  identifiantPrefix: 'cae_1',
  unit: 'kteq CO₂',
  horizonYears: HORIZON_YEARS,
  groups: [
    {
      code: 'c',
      label: 'Résidentiel',
      rows: [
        { code: 'a', label: 'Chauffage (bois)' },
        { code: 'b', label: 'Chauffage (hors bois)' },
        { code: 'c', label: 'Autres usages' },
      ],
    },
    {
      code: 'd',
      label: 'Tertiaire',
      rows: [
        { code: 'a', label: 'Chauffage' },
        { code: 'b', label: 'Autres usages' },
      ],
    },
    {
      code: 'e',
      label: 'Transport routier',
      rows: [
        { code: 'a', label: 'Mobilité locale' },
        { code: 'b', label: 'Autre mobilité' },
      ],
    },
    {
      code: 'g',
      label: 'Agriculture',
      rows: [
        { code: 'a', label: 'Énergie' },
        { code: 'b', label: 'Élevage' },
        { code: 'c', label: 'Pratiques culturales' },
      ],
    },
    {
      code: 'i',
      label: 'Industrie hors énergie',
      rows: [
        { code: 'a', label: 'Métaux primaires' },
        { code: 'b', label: 'Chimie' },
        { code: 'c', label: 'Non-métalliques' },
        { code: 'd', label: 'Agro-industrie' },
        { code: 'e', label: 'Équipements' },
        { code: 'f', label: 'Papier-carton' },
        { code: 'g', label: 'Autres industries' },
      ],
    },
    { code: 'h', label: 'Déchets', rows: [{ code: '', label: 'Déchets' }] },
  ],
};

const sequestrationGridStructure: VoletGridStructure = {
  identifiantPrefix: 'cae_63',
  unit: 'tCO₂e/an',
  horizonYears: HORIZON_YEARS,
  groups: [
    { code: 'b', label: 'Forêts', rows: [{ code: '', label: 'Forêts' }] },
    {
      code: 'c',
      label: 'Terres agricoles',
      rows: [
        { code: 'a', label: 'Cultures' },
        { code: 'b', label: 'Prairies' },
        { code: 'c', label: 'Vignes' },
        { code: 'd', label: 'Vergers' },
      ],
    },
    {
      code: 'd',
      label: 'Autres sols',
      rows: [
        { code: 'a', label: 'Zones humides' },
        { code: 'b', label: 'Sols artificiels' },
      ],
    },
    {
      code: 'e',
      label: 'Produits bois',
      rows: [{ code: '', label: 'Produits bois' }],
    },
  ],
};

const enrGridStructure: VoletGridStructure = {
  identifiantPrefix: 'cae_25',
  unit: 'GWh/an',
  horizonYears: HORIZON_YEARS,
  groups: [
    {
      code: 'a',
      label: 'Électrique',
      rows: [
        { code: 'a', label: 'Solaire photovoltaïque' },
        { code: 'b', label: 'Éolien' },
        { code: 'c', label: 'Hydraulique' },
        { code: 'd', label: 'Biomasse électrique' },
      ],
    },
    {
      code: 'b',
      label: 'Thermique',
      rows: [
        { code: 'a', label: 'Solaire thermique' },
        { code: 'b', label: 'Bois-énergie' },
        { code: 'c', label: 'Géothermie' },
        { code: 'd', label: 'Pompes à chaleur' },
        { code: 'e', label: 'Biogaz' },
      ],
    },
  ],
};

export const DEMARCHE_GRID_STRUCTURES: Partial<
  Record<DemarchePcaetVoletId, VoletGridStructure>
> = {
  polluants_atmospheriques: polluantsGridStructure,
  profil_energie_climat: profilGridStructure,
  sequestration: sequestrationGridStructure,
  enr: enrGridStructure,
};
