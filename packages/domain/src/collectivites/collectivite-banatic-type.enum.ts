import z from 'zod';

export const collectiviteBanaticSubType = {
  FiscalitePropre: 'EPCI à fiscalité propre',
  SyndicatMixte: 'Syndicat mixte',
  SyndicatCommunes: 'Syndicat de communes',
  AutreSyndicat: 'Autre type de syndicat',
} as const;

export const collectiviteNature = [
  'METRO',
  'CU',
  'CA',
  'CC',
  'SMF',
  'SMO',
  'SIVU',
  'SIVOM',
  'POLEM',
  'PETR',
  'EPT',
] as const;

export const collectiviteNatureEnumSchema = z.enum(collectiviteNature);
export type CollectiviteNatureType = (typeof collectiviteNature)[number];

export const collectiviteNatureLabel: Record<CollectiviteNatureType, string> = {
  METRO: 'Métropole',
  CU: 'Communauté urbaine',
  CA: "Communauté d'agglomération",
  CC: 'Communauté de communes',
  SMF: 'Syndicat mixte fermé',
  SMO: 'Syndicat mixte ouvert',
  SIVU: 'Syndicat intercommunal à vocation unique',
  SIVOM: 'Syndicat intercommunal à vocation multiple',
  POLEM: 'Pôle métropolitain',
  PETR: 'Pôle d’équilibre territorial rural',
  EPT: 'Établissement public territorial',
};
