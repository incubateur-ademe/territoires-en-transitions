import { RouterOutput } from '@/api/utils/trpc/client';

export type ListIndicateurValeursOutput =
  RouterOutput['indicateurs']['valeurs']['list'];

export type IndicateurSources =
  ListIndicateurValeursOutput['indicateurs'][number];

export type IndicateurSourceData = IndicateurSources['sources'][number];
export type IndicateurSourceValeur = IndicateurSourceData['valeurs'][number];
