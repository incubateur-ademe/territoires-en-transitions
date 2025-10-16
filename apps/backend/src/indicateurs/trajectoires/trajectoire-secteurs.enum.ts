import { createEnumObject } from '@/backend/utils/enum.utils';

export const trajectoireSecteursEnumValues = [
  'Résidentiel',
  'Tertiaire',
  'Industrie',
  'Agriculture',
  'Transports',
  'Déchets',
  'Branche énergie',
  'UTCATF',
  'CSC',
] as const;
export type TrajectoireSecteursType =
  (typeof trajectoireSecteursEnumValues)[number];

export const TrajectoireSecteursEnum = createEnumObject(
  trajectoireSecteursEnumValues
);
