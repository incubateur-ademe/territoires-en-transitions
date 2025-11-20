import { createEnumObject } from '@tet/domain/utils';

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

export const isTrajectoireSecteur = (
  secteur: string
): secteur is TrajectoireSecteursType => {
  return trajectoireSecteursEnumValues.includes(
    secteur as TrajectoireSecteursType
  );
};

export const TrajectoireSecteursEnum = createEnumObject(
  trajectoireSecteursEnumValues
);
