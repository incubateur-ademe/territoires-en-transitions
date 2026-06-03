import { appLabels } from '@/app/labels/catalog';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import type { PollutantConfig, SectorConfig } from './grid-model';

export const OPEN_DATA_SOURCE = IndicateurSourceEnum.CITEPA;

export const AIR_POLLUTANTS: PollutantConfig[] = [
  { letter: 'a', label: 'NOx' },
  { letter: 'b', label: 'PM10' },
  { letter: 'c', label: 'PM2.5' },
  { letter: 'd', label: 'COVNM' },
  { letter: 'e', label: 'SO2' },
  { letter: 'f', label: 'NH3' },
];

export const AIR_SECTORS: SectorConfig[] = [
  { letter: 'a', label: appLabels.demarchePcaetPolluantsSecteurResidentiel },
  { letter: 'b', label: appLabels.demarchePcaetPolluantsSecteurTertiaire },
  {
    letter: 'c',
    label: appLabels.demarchePcaetPolluantsSecteurTransportRoutier,
  },
  {
    letter: 'd',
    label: appLabels.demarchePcaetPolluantsSecteurAutresTransports,
  },
  { letter: 'e', label: appLabels.demarchePcaetPolluantsSecteurAgriculture },
  {
    letter: 'f',
    label: appLabels.demarchePcaetPolluantsSecteurIndustrieHorsEnergie,
  },
  {
    letter: 'g',
    label: appLabels.demarchePcaetPolluantsSecteurIndustrieEnergie,
  },
  { letter: 'h', label: appLabels.demarchePcaetPolluantsSecteurDechets },
];

export const HORIZON_YEARS = [2030, 2036, 2050];
